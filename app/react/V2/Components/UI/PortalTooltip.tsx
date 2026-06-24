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

const placementTransform: Record<PortalTooltipPlacement, string> = {
  left: 'translate(-100%, -50%)',
  right: 'translateY(-50%)',
  top: 'translate(-50%, -100%)',
  bottom: 'translateX(-50%)',
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

  const tooltipClassName = className;

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': position ? tooltipId : undefined,
    onBlur: hide,
    onFocus: show,
    onMouseEnter: show,
    onMouseOver: show,
    onMouseLeave: hide,
    onPointerEnter: show,
    onPointerLeave: hide,
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
            style={{
              top: position.top,
              left: position.left,
              backgroundColor: 'var(--color-theme-text-primary, #111827)',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              color: 'var(--color-theme-bg-surface, #fff)',
              fontSize: 10,
              fontWeight: 500,
              lineHeight: 1.25,
              padding: '4px 8px',
              position: 'fixed',
              pointerEvents: 'none',
              width: 'max-content',
              maxWidth: '18rem',
              zIndex: 50,
              transform: placementTransform[placement],
            }}
          >
            <div
              style={{
                display: '-webkit-box',
                overflow: 'hidden',
                overflowWrap: 'break-word',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
              }}
            >
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export { PortalTooltip };
export type { PortalTooltipProps, PortalTooltipPlacement };
