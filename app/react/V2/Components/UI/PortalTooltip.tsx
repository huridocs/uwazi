import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type PortalTooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

type PortalTooltipProps = {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: PortalTooltipPlacement;
  className?: string;
};

type TooltipPosition = {
  top: number;
  left: number;
};

const GAP = 10;

const getPosition = (rect: DOMRect, placement: PortalTooltipPlacement): TooltipPosition => {
  if (placement === 'left') return { top: rect.top + rect.height / 2, left: rect.left - GAP };
  if (placement === 'right') return { top: rect.top + rect.height / 2, left: rect.right + GAP };
  if (placement === 'bottom') return { top: rect.bottom + GAP, left: rect.left + rect.width / 2 };
  return { top: rect.top - GAP, left: rect.left + rect.width / 2 };
};

const placementClass: Record<PortalTooltipPlacement, string> = {
  left: '-translate-x-full -translate-y-1/2',
  right: '-translate-y-1/2',
  top: '-translate-x-1/2 -translate-y-full',
  bottom: '-translate-x-1/2',
};

const arrowClass: Record<PortalTooltipPlacement, string> = {
  left: 'right-[-4px] top-1/2 -translate-y-1/2',
  right: 'left-[-4px] top-1/2 -translate-y-1/2',
  top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
  bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
};

const PortalTooltip = ({
  children,
  content,
  placement = 'top',
  className = '',
}: PortalTooltipProps) => {
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipId = useId();
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition(getPosition(rect, placement));
  }, [placement]);
  const show = updatePosition;
  const hide = () => setPosition(null);

  useEffect(() => {
    if (!position) return undefined;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [position, updatePosition]);

  const tooltipClassName = [
    'pointer-events-none fixed z-50 max-w-72 rounded-md border border-border/70',
    'bg-(--color-theme-surface-raised) px-2.5 py-2 text-xs leading-snug',
    'text-ink-secondary shadow-lg',
    placementClass[placement],
    className,
  ].join(' ');

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': position ? tooltipId : undefined,
    onBlur: hide,
    onFocus: show,
    onMouseEnter: show,
    onMouseLeave: hide,
  });

  return (
    <>
      {trigger}
      {position &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={tooltipClassName}
            style={{ top: position.top, left: position.left }}
          >
            <div className="line-clamp-2 wrap-break-word">{content}</div>
            <span
              className={`absolute h-2 w-2 rotate-45 border-border/70 bg-(--color-theme-surface-raised) ${arrowClass[placement]}`}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export { PortalTooltip };
export type { PortalTooltipProps, PortalTooltipPlacement };
