import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, X } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface SwipeableNotificationProps {
  children: React.ReactNode;
  onDelete: () => Promise<void>;
  onSwipeStart?: () => void;
  disabled?: boolean;
  notificationTitle?: string;
  onContentClick?: () => void;
}

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
  children,
  onDelete,
  onSwipeStart,
  disabled = false,
  notificationTitle = 'Уведомление',
  onContentClick,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHorizontalSwipe = useRef(false);

  const REVEAL_THRESHOLD = 60; // Swipe distance to reveal delete button
  const MAX_SWIPE_DISTANCE = 90; // Maximum swipe distance (delete button width)

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
        const resistance = Math.min(absDelta * 0.25, 25); // Max resistance of 25px
        const newTranslateX = Math.max(deltaX - resistance, -MAX_SWIPE_DISTANCE);
        setTranslateX(newTranslateX);
      } else if (deltaX > 0 && translateX < 0) {
        // Allow swiping back right to close
        const newTranslateX = Math.min(translateX + deltaX * 0.5, 0);
        setTranslateX(newTranslateX);
      }
    }
    
    currentX.current = clientX;
  };

  const handleEnd = () => {
    if (!isDragging || disabled || isDeleting) return;
    
    setIsDragging(false);
    
    // Snap to reveal position or close
    setTranslateX(currentTranslateX => {
      if (currentTranslateX <= -REVEAL_THRESHOLD) {
        // Reveal delete button
        setIsRevealed(true);
        return -MAX_SWIPE_DISTANCE;
      } else {
        // Snap back closed
        setIsRevealed(false);
        return 0;
      }
    });
  };

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    setIsRevealed(false);
    
    // Slide out completely with smooth animation
    setTranslateX(-window.innerWidth);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      await onDelete();
    } catch (error) {
      // If delete fails, slide back
      setTranslateX(0);
      setIsDeleting(false);
      throw error;
    }
  }, [onDelete]);

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
  };

  const handleCloseReveal = () => {
    setIsRevealed(false);
    setTranslateX(0);
  };

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
      
      // Snap to reveal position or close
      setTranslateX(currentTranslateX => {
        if (currentTranslateX <= -REVEAL_THRESHOLD) {
          setIsRevealed(true);
          return -MAX_SWIPE_DISTANCE;
        } else {
          setIsRevealed(false);
          return 0;
        }
      });
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, disabled, isDeleting]);

  // Close reveal when clicking outside
  useEffect(() => {
    if (!isRevealed) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        handleCloseReveal();
      }
    };

    // Small delay to avoid immediate close on reveal
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isRevealed]);

  const deleteButtonWidth = MAX_SWIPE_DISTANCE;
  const showDeleteButton = translateX < -20 || isRevealed;

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Delete button background */}
        <div
          className="absolute right-0 top-0 bottom-0 z-10"
          style={{
            width: `${deleteButtonWidth}px`,
            opacity: showDeleteButton ? 1 : 0,
            transform: `scaleX(${showDeleteButton ? 1 : 0.9})`,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: showDeleteButton ? 'auto' : 'none',
          }}
        >
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 shadow-lg rounded-r-xl"
          >
            <Trash2 size={22} className="text-white mb-1 drop-shadow-sm" />
            <span className="text-xs font-medium text-white drop-shadow-sm">Удалить</span>
          </button>
        </div>

        {/* Close reveal button (appears when revealed) */}
        {isRevealed && !isDragging && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseReveal();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white/95 hover:bg-white rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95"
            style={{
              animation: 'fadeIn 0.2s ease-out, scaleIn 0.2s ease-out',
            }}
            aria-label="Закрыть"
          >
            <X size={14} className="text-gray-600" />
          </button>
        )}

        {/* Swipeable content */}
        <div
          ref={containerRef}
          className="relative"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging 
              ? 'none' 
              : isDeleting 
                ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out'
                : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isDeleting ? 0 : 1,
            touchAction: 'pan-y',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            // Don't trigger content click if delete button is revealed or if swiping
            if (isRevealed || isDragging) {
              e.stopPropagation();
              return;
            }
            onContentClick?.();
          }}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Удалить уведомление?"
        message={`Вы уверены, что хотите удалить "${notificationTitle}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />
    </>
  );
};

export default SwipeableNotification;

