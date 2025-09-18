/* eslint-disable react/no-multi-comp */
import React, { useState, useRef, useCallback, useEffect, Fragment } from 'react';

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

const Pane = ({ children, header, footer, background = 'white' }: PaneProps) => (
  <section style={{ background }} className="w-full flex flex-col h-full overflow-x-auto px-1">
    {header && <header>{header}</header>}
    <div className="flex-grow overflow-auto">{children}</div>
    {footer && <footer>{footer}</footer>}
  </section>
);

// eslint-disable-next-line max-statements
const PaneLayout = ({ children, className = '' }: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const initials = children.map(() => containerWidth / children.length - 4);
      setWidths(initials);
    }
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
    <div ref={containerRef} className={`flex w-full h-full ${className ?? ''}`}>
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
              className="w-1 cursor-col-resize flex-shrink-0 bg-black md:block hidden"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

PaneLayout.Pane = Pane;

export { PaneLayout };
