import React, { useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { t } from 'app/I18N';
import { PaneLayoutProps } from './types';

const PaneLayoutMobile = ({ children, className = '' }: PaneLayoutProps) => {
  const [currentPane, setCurrentPane] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef(0);

  const gotToPane = (paneNumber: number) => setCurrentPane(paneNumber);
  const goToNext = () => setCurrentPane(prev => (prev === children.length - 1 ? prev : prev + 1));
  const goToPrev = () => setCurrentPane(prev => (prev === 0 ? prev : prev - 1));

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0]?.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isDragging && touchStartX !== null) {
      const currentX = event.touches[0].clientX;
      const rawOffset = currentX - touchStartX;

      const atFirst = currentPane === 0 && rawOffset > 0;
      const atLast = currentPane === children.length - 1 && rawOffset < 0;

      dragOffset.current = atFirst || atLast ? rawOffset * 0.3 : rawOffset;
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isDragging && touchStartX != null) {
      const endX = event.changedTouches[0].clientX;
      const diff = endX - touchStartX;
      const threshold = 25;

      if (diff > threshold && currentPane > 0) {
        goToPrev();
      } else if (diff < -threshold && currentPane < children.length - 1) {
        goToNext();
      }

      dragOffset.current = 0;

      setTouchStartX(null);
      setIsDragging(false);
    }
  };

  return (
    <section className={`overflow-hidden relative h-full min-h-0 flex flex-col ${className}`}>
      <div
        className={`flex grow h-full min-h-0 transition-transform duration-300 ease-in-out ${
          isDragging ? 'transition-none' : ''
        }`}
        style={{
          transform: `translateX(calc(-${currentPane * 100}% + ${dragOffset.current}px))`,
        }}
      >
        {children.map((child, index) => (
          <div
            key={child.key ?? index}
            className="flex-shrink-0 w-full h-full overflow-auto min-h-0"
            style={{ background: child.props.background || 'white' }}
          >
            {child}
          </div>
        ))}
      </div>

      <nav
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex py-4 w-full flex-nowrap justify-center gap-4" aria-hidden>
          {children.map((child, index) => (
            <span
              key={child.key ?? index}
              onClick={() => gotToPane(index)}
              className={`w-2 h-2 border border-primary-300 rounded-full ${
                currentPane === index ? 'bg-primary-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        <div className="sr-only">
          <button
            onClick={goToPrev}
            type="button"
            aria-label={t('System', 'Previous', null, false)}
          >
            <ArrowLeftIcon className="w-5" />
          </button>
          <button onClick={goToNext} type="button" aria-label={t('System', 'Next', null, false)}>
            <ArrowRightIcon className="w-5" />
          </button>
        </div>
      </nav>
    </section>
  );
};

export { PaneLayoutMobile };
