/* eslint-disable react/no-multi-comp */
import React, { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { t, Translate } from 'app/I18N';

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
  <section style={{ background }} className={className}>
    {children}
  </section>
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
          <div style={{ width: widths[index] }} className="flex-shrink-0 h-full min-h-0">
            <div className="h-full min-h-0 overflow-auto">{child}</div>
          </div>

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

const PaneLayoutMobile = ({ children, className = '' }: PaneLayoutProps) => {
  const [currentPane, setCurrentPane] = useState(0);

  const goToNext = () => setCurrentPane(p => Math.min(p + 1, children.length - 1));
  const goToPrev = () => setCurrentPane(p => Math.max(p - 1, 0));

  return (
    <div className={`overflow-hidden relative h-full min-h-0 ${className}`}>
      <div
        className="flex transition-transform duration-300 ease-in-out h-full min-h-0"
        style={{ transform: `translateX(-${currentPane * 100}%)` }}
      >
        {children.map((child, index) => (
          <div
            key={child.key ?? index}
            className="flex-shrink-0 w-full h-full min-h-0"
            style={{ background: child.props.background || 'white' }}
          >
            {child}
          </div>
        ))}
      </div>

      <nav className="flex w-full justify-between sticky bottom-0">
        <button
          onClick={goToPrev}
          disabled={currentPane === 0}
          type="button"
          aria-label={t('System', 'Previous', null, false)}
        >
          <Translate>Previous</Translate>
        </button>
        <button
          onClick={goToNext}
          disabled={currentPane === children.length - 1}
          type="button"
          aria-label={t('System', 'Next', null, false)}
        >
          <Translate>Next</Translate>
        </button>
      </nav>
    </div>
  );
};

const PaneLayout = ({ children, className = '' }: PaneLayoutProps) => {
  const [isMobile, setIsMobile] = useState<boolean>();

  if (false) {
    return <PaneLayoutMobile className={className}>{children}</PaneLayoutMobile>;
  }

  return <PaneLayoutDesktop className={className}>{children}</PaneLayoutDesktop>;
};

PaneLayout.Pane = Pane;

export { PaneLayout };
