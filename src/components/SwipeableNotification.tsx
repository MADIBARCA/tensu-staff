import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableNotificationProps {
  children: React.ReactNode;
  onDelete: () => Promise<void>;
  onSwipeStart?: () => void;
  disabled?: boolean;
}

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
  children,
  onDelete,
  onSwipeStart,
  disabled = false,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontalSwipe = useRef(false);

  const DELETE_THRESHOLD = 80; // Minimum swipe distance to trigger delete
  const MAX_SWIPE_DISTANCE = 120; // Maximum swipe distance

  const handleStart = (clientX: number, clientY?: number) => {
    if (disabled || isDeleting) return;
    startX.current = clientX;
    startY.current = clientY || clientX; // Fallback for mouse events
    currentX.current = clientX;
    isHorizontalSwipe.current = false;
    setIsDragging(true);
    onSwipeStart?.();
  };

  const handleMove = (clientX: number, clientY?: number) => {
    if (!isDragging || disabled || isDeleting) return;
    
    const deltaX = clientX - startX.current;
    const deltaY = clientY !== undefined ? Math.abs(clientY - startY.current) : 0;
    
    // Determine if this is a horizontal swipe (more horizontal than vertical movement)
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = Math.abs(deltaX) > deltaY;
    }
    
    // Only process if it's a horizontal swipe
    if (isHorizontalSwipe.current) {
      // Only allow swiping left (negative deltaX)
      if (deltaX < 0) {
        // Apply smooth resistance - easier to start, harder as you go further
        const absDelta = Math.abs(deltaX);
        const resistance = Math.min(absDelta * 0.3, 30); // Max resistance of 30px
        const newTranslateX = Math.max(deltaX - resistance, -MAX_SWIPE_DISTANCE);
        setTranslateX(newTranslateX);
      } else {
        // Allow slight right swipe for natural feel, but snap back quickly
        setTranslateX(Math.min(deltaX * 0.3, 0));
      }
    }
    
    currentX.current = clientX;
  };

  const handleEnd = () => {
    if (!isDragging || disabled || isDeleting) return;
    
    setIsDragging(false);
    
    // If swiped past threshold, delete
    setTranslateX(currentTranslateX => {
      if (currentTranslateX <= -DELETE_THRESHOLD) {
        handleDelete();
        return currentTranslateX;
      }
      return 0;
    });
  };

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setTranslateX(-window.innerWidth); // Slide out completely
    
    try {
      await onDelete();
    } catch (error) {
      // If delete fails, slide back
      setTranslateX(0);
      setIsDeleting(false);
      throw error;
    }
  }, [onDelete]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Only prevent default if we're doing a horizontal swipe
    if (isHorizontalSwipe.current) {
      e.preventDefault();
    }
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events (for desktop testing)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  // Global mouse move/up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      
      // If swiped past threshold, delete
      setTranslateX(currentTranslateX => {
        if (currentTranslateX <= -DELETE_THRESHOLD) {
          handleDelete();
        }
        return currentTranslateX <= -DELETE_THRESHOLD ? currentTranslateX : 0;
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, disabled, isDeleting, handleDelete]);

  const deleteButtonWidth = 80;
  const showDeleteButton = translateX < -20;

  return (
    <div className="relative overflow-hidden">
      {/* Delete button background */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-red-500 z-10 transition-opacity duration-200"
        style={{
          width: `${deleteButtonWidth}px`,
          opacity: showDeleteButton ? 1 : 0,
        }}
      >
        <Trash2 size={20} className="text-white" />
      </div>

      {/* Swipeable content */}
      <div
        ref={containerRef}
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal when needed
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableNotification;

