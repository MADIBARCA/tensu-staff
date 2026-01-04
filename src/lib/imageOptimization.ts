/**
 * Optimize image with adaptive compression to meet size requirements
 */

const MAX_LOGO_OUTPUT_SIZE = 300 * 1024; // 300KB
const MAX_COVER_OUTPUT_SIZE = 1.5 * 1024 * 1024; // 1.5MB

export interface OptimizeOptions {
  kind: 'logo' | 'cover';
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
}

/**
 * Optimize image blob with adaptive compression
 * The blob should already be cropped/processed, this function optimizes it further
 */
export async function optimizeImage(
  blob: Blob,
  options: OptimizeOptions
): Promise<Blob> {
  const maxOutputSize = options.kind === 'logo' ? MAX_LOGO_OUTPUT_SIZE : MAX_COVER_OUTPUT_SIZE;
  
  // Check if already small enough
  if (blob.size <= maxOutputSize) {
    return blob;
  }
  
  // Load image from blob
  const img = await loadImageFromBlob(blob);
  
  // Get current dimensions from image
  let targetWidth = img.width;
  let targetHeight = img.height;
  
  if (options.kind === 'logo') {
    // Logo: ensure square, max 512x512
    const size = Math.min(targetWidth, targetHeight, 512);
    targetWidth = size;
    targetHeight = size;
  } else {
    // Cover: maintain aspect ratio, max width 1600px
    const maxWidth = options.maxWidth || 1600;
    if (targetWidth > maxWidth) {
      targetHeight = (targetHeight / targetWidth) * maxWidth;
      targetWidth = maxWidth;
    }
  }
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  
  // Draw image (scaled to fit)
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  
  // Try different quality levels
  const qualityLevels = [0.82, 0.75, 0.65, 0.55, 0.45];
  
  for (let i = 0; i < qualityLevels.length; i++) {
    const quality = qualityLevels[i];
    const optimizedBlob = await canvasToWebPBlob(canvas, quality);
    
    if (optimizedBlob.size <= maxOutputSize) {
      return optimizedBlob;
    }
  }
  
  // If still too large, reduce dimensions and retry
  return await reduceDimensionsAndOptimize(canvas, maxOutputSize, options.kind);
}

/**
 * Load image from blob
 */
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Convert canvas to WebP blob
 */
function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
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
 * Reduce dimensions and optimize further
 */
async function reduceDimensionsAndOptimize(
  canvas: HTMLCanvasElement,
  maxSize: number,
  kind: 'logo' | 'cover'
): Promise<Blob> {
  let currentWidth = canvas.width;
  let currentHeight = canvas.height;
  const minDimension = kind === 'logo' ? 256 : 800;
  
  // Reduce dimensions progressively
  while (currentWidth > minDimension || currentHeight > minDimension) {
    currentWidth = Math.max(Math.floor(currentWidth * 0.9), minDimension);
    currentHeight = kind === 'logo' 
      ? currentWidth 
      : Math.max(Math.floor(currentHeight * 0.9), minDimension);
    
    const newCanvas = document.createElement('canvas');
    newCanvas.width = currentWidth;
    newCanvas.height = currentHeight;
    const ctx = newCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.drawImage(canvas, 0, 0, currentWidth, currentHeight);
    
    // Try different quality levels
    for (const quality of [0.6, 0.5, 0.4, 0.3]) {
      const blob = await canvasToWebPBlob(newCanvas, quality);
      if (blob.size <= maxSize) {
        return blob;
      }
    }
    
    canvas = newCanvas;
  }
  
  // Last resort: minimum quality at minimum dimensions
  const finalBlob = await canvasToWebPBlob(canvas, 0.3);
  if (finalBlob.size > maxSize) {
    throw new Error('IMAGE_TOO_LARGE_AFTER_OPTIMIZATION');
  }
  
  return finalBlob;
}
