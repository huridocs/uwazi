/* eslint-disable react/no-multi-comp */
import React, { useState, useRef, useCallback, useEffect, Fragment } from 'react';
import { t, Translate } from 'app/I18N';

const getClientXValue = (event: MouseEvent | TouchEvent): number | undefined => {
  if ('clientX' in event) {
    return event.clientX;
  }
  if ('touches' in event && event.touches.length) {
    return event.touches[0].clientX;
  }
  return undefined;
};

type PaneProps = React.PropsWithChildren & {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  background?: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  className?: string;
};

const MIN_WIDTH = 100;
const MOBILE_VIEW_MAX_WIDTH = 768;

const Pane = ({ children, header, footer, background = 'white' }: PaneProps) => (
  <section style={{ background }} className="flex h-full flex-col gap-1">
    {header && <header>{header}</header>}
    <div className="flex-grow overflow-auto">{children}</div>
    {footer && <footer>{footer}</footer>}
  </section>
);

// eslint-disable-next-line max-statements
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
    <div ref={containerRef} className={`flex ${className ?? ''}`}>
      {children.map((child, index) => (
        <Fragment key={child.key!}>
          <div
            style={{
              width: widths[index],
              background: child.props.background || 'white',
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              aria-hidden
              onMouseDown={event => onMouseDown(event, index)}
              onTouchStart={event => onTouchStart(event, index)}
              className="w-1 cursor-col-resize flex-shrink-0 bg-black"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

const PaneLayoutMobile = ({ children, className = '' }: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPane, setCurrentPane] = useState(0);

  const goToNext = () => {
    setCurrentPane(prev => Math.min(prev + 1, children.length - 1));
  };

  const goToPrev = () => {
    setCurrentPane(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className={`overflow-hidden relative ${className}`}>
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-in-out h-full"
        style={{ transform: `translateX(-${currentPane * 100}%)` }}
      >
        {children.map(child => (
          <div
            key={child.key!}
            className="flex-shrink-0 w-full h-full"
            style={{ background: child.props.background || 'white' }}
          >
            {child}
          </div>
        ))}
      </div>

      <nav className="flex w-full justify-between sticky">
        <button
          onClick={goToPrev}
          disabled={currentPane === 0}
          type="button"
          aria-label={t('System', 'Previus', null, false)}
        >
          <Translate>Previus</Translate>
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
