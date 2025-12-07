import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ArrowRight, Check } from 'lucide-react';

interface CheckInSliderProps {
  onCheckIn: () => void;
}

export const CheckInSlider: React.FC<CheckInSliderProps> = ({ onCheckIn }) => {
  const { t } = useI18n();
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const maxPositionRef = useRef<number>(0);

  useEffect(() => {
    if (sliderRef.current) {
      maxPositionRef.current = sliderRef.current.offsetWidth - 60; // 60px is thumb width
    }
  }, []);

  const handleStart = (clientX: number) => {
    if (isCheckedIn) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || isCheckedIn) return;
    
    const newPosition = clientX - startXRef.current;
    const clampedPosition = Math.max(0, Math.min(newPosition, maxPositionRef.current));
    setSliderPosition(clampedPosition);
  };

  const handleEnd = () => {
    if (!isDragging || isCheckedIn) return;
    
    setIsDragging(false);
    
    // Check if slider is at least 80% of the way
    const threshold = maxPositionRef.current * 0.8;
    if (sliderPosition >= threshold) {
      setSliderPosition(maxPositionRef.current);
      setIsCheckedIn(true);
      onCheckIn();
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsCheckedIn(false);
        setSliderPosition(0);
      }, 2000);
    } else {
      // Snap back
      setSliderPosition(0);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (for desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Global mouse events
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e.clientX);
      const handleGlobalMouseUp = () => handleEnd();

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const percentage = maxPositionRef.current > 0 
    ? (sliderPosition / maxPositionRef.current) * 100 
    : 0;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        {t('home.checkin.title')}
      </h2>
      
      <div className="relative">
        {/* Track */}
        <div className="h-14 bg-gray-200 rounded-full overflow-hidden relative">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200 ease-out"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Text overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className={`font-medium transition-colors ${
              percentage > 50 ? 'text-white' : 'text-gray-600'
            }`}>
              {isCheckedIn ? t('home.checkin.success') : t('home.checkin.slide')}
            </span>
          </div>
        </div>

        {/* Thumb */}
        <div
          ref={sliderRef}
          className="absolute top-0 left-0 h-14 w-full cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            className={`absolute top-1 left-1 h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-transform duration-200 ease-out ${
              isCheckedIn ? 'bg-green-500' : ''
            }`}
            style={{
              transform: `translateX(${sliderPosition}px)`,
            }}
          >
            {isCheckedIn ? (
              <Check size={24} className="text-white" />
            ) : (
              <ArrowRight size={20} className="text-blue-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
