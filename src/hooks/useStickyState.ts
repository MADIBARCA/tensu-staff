import React, { useEffect, useRef, useState } from 'react';

/**
 * Hook to detect when a sticky element becomes active using IntersectionObserver.
 * Uses a sentinel element approach for better performance (no scroll listeners).
 * 
 * @param enabled - Whether the hook is enabled (default: true)
 * @returns Object containing:
 *   - isSticky: boolean indicating if sticky is active
 *   - sentinelRef: ref to attach to the sentinel element (place before sticky element)
 *   - stickyRef: ref to attach to the sticky element (supports div, header, and other HTMLElements)
 */
export function useStickyState(enabled: boolean = true) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsSticky(false);
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel is not visible (intersectionRatio === 0),
        // it means the sticky element has scrolled past the top
        const entry = entries[0];
        setIsSticky(entry.intersectionRatio === 0);
      },
      {
        // Root margin to account for any offset
        rootMargin: '0px',
        threshold: [0, 1],
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  return {
    isSticky,
    sentinelRef,
    stickyRef: stickyRef as React.RefObject<HTMLElement>,
  };
}
