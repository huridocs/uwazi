/* eslint-disable react/no-multi-comp */
import React, { Fragment, useRef, useState } from 'react';

type PaneHeadingProps = React.PropsWithChildren;

type PaneFooterProps = React.PropsWithChildren;

type PaneProps = {
  children: [
    React.ReactElement<PaneHeadingProps>,
    React.ReactNode,
    React.ReactElement<PaneFooterProps>,
  ];
  key: string;
};

type PaneLayoutProps = {
  children: React.ReactElement<PaneProps>[];
  className?: string;
};

const PaneHeading = ({ children }: PaneHeadingProps) => <div>{children}</div>;

const PaneFooter = ({ children }: PaneFooterProps) => <div>{children}</div>;

const Pane = ({ children, key }: PaneProps) => {
  const [heading, content, footer] = children;
  return (
    <section key={key} className="flex flex-col gap-2">
      <div>{heading}</div>
      <div>{content}</div>
      <div>{footer}</div>
    </section>
  );
};

const PaneLayout = ({ children, className }: PaneLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [widths, setWidths] = useState<number[]>(
    Array(children.length).fill(100 / children.length)
  );

  const startDrag = (index: number, event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const startWidths = [...widths];

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = currentX - startX;

      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;

      const percentDelta = (deltaX / containerWidth) * 100;

      const newWidths = [...startWidths];
      newWidths[index] = Math.max(5, startWidths[index] + percentDelta);
      newWidths[index + 1] = Math.max(5, startWidths[index + 1] - percentDelta);

      setWidths(newWidths);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  };

  const gridTemplate = widths
    .map((width, index) => `${width}%${index < widths.length - 1 ? ' 8px' : ''}`)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={`${className ?? ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        height: '100%',
        width: '100%',
      }}
    >
      {children.map((child, index) => (
        <Fragment key={child.key}>
          {child}
          {index < children.length - 1 && (
            <div
              style={{
                cursor: 'col-resize',
                background: 'black',
              }}
              onMouseDown={event => startDrag(index, event)}
              onTouchStart={event => startDrag(index, event)}
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
