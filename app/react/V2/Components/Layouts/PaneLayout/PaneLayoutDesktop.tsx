import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { PaneLayoutProps } from './types';

const MIN_WIDTH = 100;

const getClientXValue = (event: MouseEvent | TouchEvent): number | undefined => {
  if ('clientX' in event) return event.clientX;
  if ('touches' in event && event.touches.length) return event.touches[0].clientX;
  return undefined;
};

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

export { PaneLayoutDesktop };
