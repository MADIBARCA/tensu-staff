import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, ensureAnonAuth } from './firebase';
import { optimizeImage } from './imageOptimization';

export interface UploadOptions {
  kind: 'logo' | 'cover';
  clubKey: string;
}

export interface ClubImageUploadResult {
  downloadURL: string;
  storagePath: string;
}

const MAX_LOGO_INPUT_SIZE = 10 * 1024 * 1024; // 10MB input (safety guard)
const MAX_COVER_INPUT_SIZE = 15 * 1024 * 1024; // 15MB input (safety guard)

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validate file before processing (only type and safety guard size)
 */
function validateFile(file: File, kind: 'logo' | 'cover'): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  const maxSize = kind === 'logo' ? MAX_LOGO_INPUT_SIZE : MAX_COVER_INPUT_SIZE;
  if (file.size > maxSize) {
    throw new Error(kind === 'logo' ? 'LOGO_TOO_LARGE_INPUT' : 'COVER_TOO_LARGE_INPUT');
  }
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create canvas and draw image with crop
 */
function createCanvas(
  img: HTMLImageElement,
  cropArea: { x: number; y: number; width: number; height: number },
  outputWidth: number,
  outputHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas;
}

/**
 * Compress image to WebP with quality adjustment
 */
function canvasToWebPBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Process logo image: square crop, 512x512
 * Note: Output will be optimized by optimizeImage() before upload
 */
async function processLogo(
  img: HTMLImageElement
): Promise<Blob> {
  const size = Math.min(img.width, img.height);
  const x = (img.width - size) / 2;
  const y = (img.height - size) / 2;

  const cropArea = { x, y, width: size, height: size };
  const outputSize = 512;

  const canvas = createCanvas(img, cropArea, outputSize, outputSize);
  return await canvasToWebPBlob(canvas, 0.9);
}

/**
 * Process cover image: 16:9 crop, max width 1600px
 * Note: Output will be optimized by optimizeImage() before upload
 */
async function processCover(
  img: HTMLImageElement
): Promise<Blob> {
  const targetRatio = 16 / 9;
  const imgRatio = img.width / img.height;

  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;

  if (imgRatio > targetRatio) {
    // Image is wider, crop width
    cropHeight = img.height;
    cropWidth = img.height * targetRatio;
    cropX = (img.width - cropWidth) / 2;
    cropY = 0;
  } else {
    // Image is taller, crop height
    cropWidth = img.width;
    cropHeight = img.width / targetRatio;
    cropX = 0;
    cropY = (img.height - cropHeight) / 2;
  }

  const maxWidth = 1600;
  const outputWidth = Math.min(cropWidth, maxWidth);
  const outputHeight = (outputWidth / cropWidth) * cropHeight;

  const cropArea = { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  const canvas = createCanvas(img, cropArea, outputWidth, outputHeight);
  return await canvasToWebPBlob(canvas, 0.85);
}

/**
 * Process image with crop area (for interactive cropping)
 * Returns cropped blob that will be optimized later
 */
export async function processImageWithCrop(
  file: File,
  kind: 'logo' | 'cover',
  cropArea: { x: number; y: number; width: number; height: number },
  zoom: number = 1
): Promise<Blob> {
  validateFile(file, kind);

  const img = await loadImage(file);
  
  // Apply zoom to crop area
  const scaledCrop = {
    x: cropArea.x / zoom,
    y: cropArea.y / zoom,
    width: cropArea.width / zoom,
    height: cropArea.height / zoom,
  };

  if (kind === 'logo') {
    // For logo, ensure square output
    const size = Math.min(scaledCrop.width, scaledCrop.height);
    const centeredCrop = {
      x: scaledCrop.x + (scaledCrop.width - size) / 2,
      y: scaledCrop.y + (scaledCrop.height - size) / 2,
      width: size,
      height: size,
    };
    
    const canvas = createCanvas(img, centeredCrop, 512, 512);
    return await canvasToWebPBlob(canvas, 0.9);
  } else {
    // For cover, maintain 16:9 ratio
    const targetRatio = 16 / 9;
    const cropRatio = scaledCrop.width / scaledCrop.height;
    
    const finalCrop = { ...scaledCrop };
    if (cropRatio > targetRatio) {
      // Crop is wider, adjust height
      const newHeight = scaledCrop.width / targetRatio;
      finalCrop.y = scaledCrop.y + (scaledCrop.height - newHeight) / 2;
      finalCrop.height = newHeight;
    } else {
      // Crop is taller, adjust width
      const newWidth = scaledCrop.height * targetRatio;
      finalCrop.x = scaledCrop.x + (scaledCrop.width - newWidth) / 2;
      finalCrop.width = newWidth;
    }

    const maxWidth = 1600;
    const outputWidth = Math.min(finalCrop.width, maxWidth);
    const outputHeight = (outputWidth / finalCrop.width) * finalCrop.height;

    const canvas = createCanvas(img, finalCrop, outputWidth, outputHeight);
    return await canvasToWebPBlob(canvas, 0.85);
  }
}

/**
 * Upload optimized blob to Firebase Storage
 */
export async function uploadOptimizedBlob(
  optimizedBlob: Blob,
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<ClubImageUploadResult> {
  // Ensure anonymous auth
  await ensureAnonAuth();

  // Upload to Firebase Storage
  const storagePath = `club-images/${options.clubKey}/${options.kind}.webp`;
  const storageRef = ref(storage, storagePath);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, optimizedBlob);
  
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => reject(error),
      () => resolve()
    );
  });  
  if (onProgress) {
    onProgress(100);
  }

  const downloadURL = await getDownloadURL(storageRef);

  return {
    downloadURL,
    storagePath,
  };
}

/**
 * Upload club image to Firebase Storage (legacy - for non-cropped uploads)
 */
export async function uploadClubImage(
  file: File,
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<ClubImageUploadResult> {
  validateFile(file, options.kind);

  // Ensure anonymous auth
  await ensureAnonAuth();

  // Process image
  const img = await loadImage(file);
  let processedBlob: Blob;

  if (options.kind === 'logo') {
    processedBlob = await processLogo(img);
  } else {
    processedBlob = await processCover(img);
  }

  // Optimize the processed blob
  const optimizedBlob = await optimizeImage(processedBlob, { kind: options.kind });

  return uploadOptimizedBlob(optimizedBlob, options, onProgress);
}
