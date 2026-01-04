import React, { useState, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Image, Maximize2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useI18n } from '@/i18n/i18n';

interface ImageCropModalProps {
  image: string;
  aspect: number;
  onClose: () => void;
  onCrop: (croppedArea: Area, zoom: number) => void;
  kind?: 'logo' | 'cover';
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  image,
  aspect,
  onClose,
  onCrop,
  kind = 'logo',
}) => {
  const { t } = useI18n();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCrop(croppedAreaPixels, zoom);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 1));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const title = kind === 'logo' 
    ? t('imageCrop.titleLogo')
    : t('imageCrop.titleCover');

  const hint = kind === 'logo'
    ? t('imageCrop.hintLogo')
    : t('imageCrop.hintCover');

  const aspectLabel = kind === 'logo' ? '1:1' : '16:9';

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X size={22} />
        </button>
        <div className="text-center">
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-white/60 text-xs mt-0.5">{hint}</p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={!croppedAreaPixels}
          className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={22} />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape={kind === 'logo' ? 'round' : 'rect'}
          showGrid={true}
          classes={{
            containerClassName: 'bg-black',
            mediaClassName: 'max-h-full',
          }}
          style={{
            cropAreaStyle: {
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            },
          }}
        />

        {/* Aspect Ratio Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
          <Maximize2 size={12} className="text-white/70" />
          <span className="text-white/90 text-xs font-medium">{aspectLabel}</span>
        </div>

        {/* Image Type Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
          <Image size={12} className="text-white/70" />
          <span className="text-white/90 text-xs font-medium">
            {kind === 'logo' ? t('imageCrop.logo') : t('imageCrop.cover')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 bg-black/80 backdrop-blur-sm px-4 py-4 space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">{t('imageCrop.zoom')}</span>
            <span className="text-white/90 text-sm font-semibold">{Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ZoomOut size={18} className="text-white" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:cursor-pointer"
              />
              {/* Progress indicator */}
              <div 
                className="absolute top-0 left-0 h-1.5 bg-blue-500 rounded-full pointer-events-none"
                style={{ width: `${((zoom - 1) / 2) * 100}%` }}
              />
            </div>
            
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ZoomIn size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            <RotateCcw size={16} />
            <span className="text-sm font-medium">{t('imageCrop.reset')}</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            <span className="text-sm font-medium">{t('common.cancel')}</span>
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span className="text-sm font-medium">{t('imageCrop.apply')}</span>
          </button>
        </div>

        {/* Instruction Text */}
        <p className="text-center text-white/50 text-xs">
          {t('imageCrop.instruction')}
        </p>
      </div>
    </div>
  );
};
