import React, {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type AnchoredPortalProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  onClose?: () => void;
  prefer?: 'start' | 'end';
  width?: number;
  className?: string;
};

const GAP = 4;
const PAD = 8;

const getThemedPortalRoot = (from: HTMLElement | null) => {
  if (typeof document === 'undefined') return null;
  return (
    from?.closest<HTMLElement>('.tw-content') ||
    document.querySelector<HTMLElement>('.tw-content') ||
    document.body
  );
};

const placePanel = (
  anchor: DOMRect,
  panel: DOMRect,
  prefer: 'start' | 'end',
  width?: number
): CSSProperties => {
  const w = width ?? panel.width;
  let left = prefer === 'end' ? anchor.right - w : anchor.left;
  left = Math.min(Math.max(PAD, left), window.innerWidth - PAD - w);

  let top = anchor.bottom + GAP;
  if (top + panel.height > window.innerHeight - PAD) {
    top = Math.max(PAD, anchor.top - GAP - panel.height);
  }

  return {
    position: 'fixed',
    top,
    left,
    width: width ?? undefined,
    minWidth: width ? undefined : panel.width,
    zIndex: 60,
  };
};

/** Tooltip-style overlay: portals into .tw-content and flips when space is short. */
const AnchoredPortal = ({
  open,
  anchorRef,
  children,
  onClose,
  prefer = 'end',
  width,
  className = '',
}: AnchoredPortalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: 60,
  });

  useLayoutEffect(() => {
    if (!open) return undefined;

    const update = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      setStyle({ ...placePanel(anchor, panel, prefer, width), visibility: 'visible' });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, prefer, width]);

  if (!open) return null;

  const portalRoot = getThemedPortalRoot(anchorRef.current);
  if (!portalRoot) return null;

  const needsThemeScope = !portalRoot.classList.contains('tw-content');
  const panelClass = needsThemeScope ? `tw-content ${className}`.trim() : className;

  return createPortal(
    <>
      <div
        className={needsThemeScope ? 'tw-content fixed inset-0 z-50' : 'fixed inset-0 z-50'}
        aria-hidden
        onClick={onClose}
      />
      <div ref={panelRef} style={style} className={panelClass}>
        {children}
      </div>
    </>,
    portalRoot
  );
};

export type { AnchoredPortalProps };
export { AnchoredPortal };
