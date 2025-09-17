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

type PaneHeadingProps = React.PropsWithChildren;
type PaneFooterProps = React.PropsWithChildren;

type PaneProps = {
  children: [
    React.ReactElement<PaneHeadingProps>,
    React.ReactNode,
    React.ReactElement<PaneFooterProps>,
  ];
  background?: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  className?: string;
};

const MIN_WIDTH = 100;

const PaneHeading = ({ children }: PaneHeadingProps) => <div>{children}</div>;
const PaneFooter = ({ children }: PaneFooterProps) => <div>{children}</div>;

const Pane = ({ children, background = 'white' }: PaneProps) => {
  const [heading, content, footer] = children;
  return (
    <div style={{ background }} className="w-full flex flex-col h-full overflow-x-auto min-w-80">
      <div>{heading}</div>
      <div className="flex-grow overflow-auto">{content}</div>
      <div>{footer}</div>
    </div>
  );
};

// eslint-disable-next-line max-statements
const PaneLayout = ({ children, className = '' }: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);
  const [widths, setWidths] = useState<number[]>([]);

  const totalWidth = widths.reduce((a, b) => a + b, 0) || 1;
  const percentages = widths.map(w => `${(w / totalWidth) * 100}%`);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const initial = children.map(() => containerWidth / children.length);
      setWidths(initial);
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
            className="px-2"
            style={{ width: percentages[index], background: child.props.background || 'white' }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
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

PaneLayout.Pane = Pane;
PaneLayout.PaneHeading = PaneHeading;
PaneLayout.PaneFooter = PaneFooter;

export { PaneLayout };
