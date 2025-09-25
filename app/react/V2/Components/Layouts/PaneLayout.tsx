/* eslint-disable react/no-multi-comp */
import React, { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { t, Translate } from 'app/I18N';
import { isClient } from 'app/utils';

const getClientXValue = (event: MouseEvent | TouchEvent): number | undefined => {
  if ('clientX' in event) return event.clientX;
  if ('touches' in event && event.touches.length) return event.touches[0].clientX;
  return undefined;
};

type PaneProps = React.PropsWithChildren & {
  background?: string;
  className?: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  className?: string;
};

const MIN_WIDTH = 100;
const MOBILE_VIEW_MAX_WIDTH = 768;

const Pane = ({ children, className, background = 'white' }: PaneProps) => (
  <div style={{ background }} className={className}>
    {children}
  </div>
);

const PaneLayoutDesktop = ({ children, className = '' }: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const initials = children.map(() => containerWidth / children.length - 4);
        setWidths(initials);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // Only update if the number of children changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children.length]);

  const resizeHandler = useCallback(
    // eslint-disable-next-line max-statements
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault?.();
      if (draggingIndex.current === null || !containerRef.current) return;
      const xValue = getClientXValue(event);
      if (xValue === undefined) return;
      const newWidths = [...widths];
      const leftIndex = draggingIndex.current;
      const rightIndex = leftIndex + 1;
      const leftStart = newWidths.slice(0, leftIndex).reduce((a, b) => a + b, 0);
      const currentLeft = xValue - containerRef.current.getBoundingClientRect().left - leftStart;
      const totalPair = newWidths[leftIndex] + newWidths[rightIndex];
      const rightNew = totalPair - currentLeft;
      if (currentLeft >= MIN_WIDTH && rightNew >= MIN_WIDTH) {
        newWidths[leftIndex] = currentLeft;
        newWidths[rightIndex] = rightNew;
        setWidths(newWidths);
      }
    },
    [widths]
  );

  const onMouseUp = () => {
    draggingIndex.current = null;
    document.removeEventListener('mousemove', resizeHandler);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    draggingIndex.current = index;
    document.addEventListener('mousemove', resizeHandler);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onTouchEnd = () => {
    draggingIndex.current = null;
    document.removeEventListener('touchmove', resizeHandler);
    document.removeEventListener('touchend', onTouchEnd);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    draggingIndex.current = index;
    document.addEventListener('touchmove', resizeHandler, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  };

  return (
    <div ref={containerRef} className={`flex h-full min-h-0 ${className ?? ''}`}>
      {children.map((child, index) => (
        <Fragment key={child.key ?? index}>
          <section style={{ width: widths[index] }} className="h-full min-h-0">
            {/* tabIndex requiered by cypress accessibility test */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <div tabIndex={0} className="h-full min-h-0 overflow-auto">
              {child}
            </div>
          </section>

          {index < children.length - 1 && (
            <div
              role="separator"
              aria-hidden
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="w-1 cursor-col-resize flex-shrink-0 bg-gray-200"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

// eslint-disable-next-line max-statements
const PaneLayoutMobile = ({ children, className = '' }: PaneLayoutProps) => {
  const [currentPane, setCurrentPane] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchMoveX, setTouchMoveX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const gotToPane = (paneNumber: number) => setCurrentPane(paneNumber);
  const goToNext = () => setCurrentPane(prev => (prev + 1) % children.length);
  const goToPrev = () => setCurrentPane(prev => (prev - 1) % children.length);

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0]?.clientX);
    setTouchMoveX(null);
    setIsDragging(true);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (isDragging) {
      setTouchMoveX(event.touches[0].clientX);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isDragging && touchStartX != null) {
      const endX = event.changedTouches[0].clientX;
      const diff = endX - touchStartX;
      const threshold = 50;

      if (diff > threshold) {
        goToPrev();
      } else if (diff < -threshold) {
        goToNext();
      }

      setTouchStartX(null);
      setTouchMoveX(null);
      setIsDragging(false);
    }
  };

  const dragOffset =
    isDragging && touchStartX !== null && touchMoveX !== null ? touchMoveX - touchStartX : 0;

  return (
    <section className={`overflow-hidden relative h-full min-h-0 flex flex-col ${className}`}>
      <div
        className={`flex grow h-full min-h-0 transition-transform duration-300 ease-in-out ${
          isDragging ? 'transition-none' : ''
        }`}
        style={{
          transform: `translateX(calc(-${currentPane * 100}% + ${dragOffset}px))`,
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
        <div className="flex p-2 w-full flex-nowrap justify-around">
          {children.map((_child, index) => (
            <button
              onClick={() => gotToPane(index)}
              type="button"
              aria-hidden
              className={`w-2 h-2 border border-primary-300 rounded-full ${currentPane === index ? 'bg-primary-500' : 'bg-transparent'}`}
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

const PaneLayout = ({ children, className = '' }: PaneLayoutProps) => {
  const [isMobile, setIsMobile] = useState<boolean>();

  useEffect(() => {
    let maxWidthObserver: MediaQueryList;

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_VIEW_MAX_WIDTH);
    };

    if (isClient) {
      maxWidthObserver = window.matchMedia(`(max-width: ${MOBILE_VIEW_MAX_WIDTH - 1}px)`);

      maxWidthObserver.addEventListener('change', onChange);

      setIsMobile(window.innerWidth < MOBILE_VIEW_MAX_WIDTH);
    }

    return () => {
      if (maxWidthObserver) {
        maxWidthObserver.removeEventListener('change', onChange);
      }
    };
  }, []);

  if (isMobile) {
    return <PaneLayoutMobile className={className}>{children}</PaneLayoutMobile>;
  }

  return <PaneLayoutDesktop className={className}>{children}</PaneLayoutDesktop>;
};

PaneLayout.Pane = Pane;

export { PaneLayout };
