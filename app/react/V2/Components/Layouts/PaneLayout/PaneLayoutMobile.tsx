import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { t } from '#app/I18N/index.js';
import { PaneLayoutProps } from './types.js';

const LEGACY_MENU_HEIGHT = '50px';

const useRequestedPane = (
  requestedPane: PaneLayoutProps['requestedPane'],
  setCurrentPane: (index: number) => void
) => {
  const requestId = requestedPane?.id;
  const requestIndex = requestedPane?.index;

  useEffect(() => {
    if (requestIndex === undefined) return;
    setCurrentPane(requestIndex);
  }, [requestId, requestIndex, setCurrentPane]);
};

const usePaneDrag = (
  currentPane: number,
  paneCount: number,
  setCurrentPane: (index: number) => void
) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef(0);

  const goToNext = () =>
    setCurrentPane(currentPane === paneCount - 1 ? currentPane : currentPane + 1);
  const goToPrev = () => setCurrentPane(currentPane === 0 ? currentPane : currentPane - 1);

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0]?.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isDragging && touchStartX !== null) {
      const currentX = event.touches[0].clientX;
      const rawOffset = currentX - touchStartX;
      const atFirst = currentPane === 0 && rawOffset > 0;
      const atLast = currentPane === paneCount - 1 && rawOffset < 0;
      dragOffset.current = atFirst || atLast ? rawOffset * 0.3 : rawOffset;
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isDragging && touchStartX != null) {
      const endX = event.changedTouches[0].clientX;
      const diff = endX - touchStartX;
      const threshold = 25;
      if (diff > threshold && currentPane > 0) goToPrev();
      else if (diff < -threshold && currentPane < paneCount - 1) goToNext();
      dragOffset.current = 0;
      setTouchStartX(null);
      setIsDragging(false);
    }
  };

  return {
    isDragging,
    dragOffset,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    goToPrev,
    goToNext,
  };
};

const PaneLayoutMobile = ({ children, className = '', requestedPane }: PaneLayoutProps) => {
  const [currentPane, setCurrentPane] = useState(0);
  useRequestedPane(requestedPane, setCurrentPane);
  const drag = usePaneDrag(currentPane, children.length, setCurrentPane);

  return (
    <section
      style={{
        maxHeight: `calc(min(100dvh, 100vh) - ${LEGACY_MENU_HEIGHT} - env(safe-area-inset-bottom, 0px))`,
      }}
      className={`overflow-hidden relative min-h-0 h-full flex flex-col ${className}`}
    >
      <div
        data-testid="pane-track"
        className={`flex grow h-full min-h-0 transition-transform duration-300 ease-in-out ${
          drag.isDragging ? 'transition-none' : ''
        }`}
        style={{
          transform: `translateX(calc(-${currentPane * 100}% + ${drag.dragOffset.current}px))`,
        }}
      >
        {children.map((child, index) => (
          <div
            key={child.key ?? index}
            className="shrink-0 w-full max-w-full min-w-0 h-full overflow-x-hidden overflow-y-auto"
            style={{ background: child.props.background || 'white' }}
          >
            {child}
          </div>
        ))}
      </div>

      <nav
        onTouchStart={drag.handleTouchStart}
        onTouchMove={drag.handleTouchMove}
        onTouchEnd={drag.handleTouchEnd}
      >
        <div className="flex py-4 w-full flex-nowrap justify-center gap-4" aria-hidden>
          {children.map((child, index) => (
            <span
              key={child.key ?? index}
              onClick={() => setCurrentPane(index)}
              className={`w-2 h-2 border border-primary-300 rounded-full ${
                currentPane === index ? 'bg-primary-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        <div className="sr-only">
          <button
            onClick={drag.goToPrev}
            type="button"
            aria-label={t('System', 'Previous', null, false)}
          >
            <ArrowLeftIcon className="w-5" />
          </button>
          <button
            onClick={drag.goToNext}
            type="button"
            aria-label={t('System', 'Next', null, false)}
          >
            <ArrowRightIcon className="w-5" />
          </button>
        </div>
      </nav>
    </section>
  );
};

export { PaneLayoutMobile };
