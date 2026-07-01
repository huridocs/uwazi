import React, { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type DrawerScope = 'fixed' | 'absolute';
type DrawerMotion = 'spring' | 'ease-out' | 'none';

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scope?: DrawerScope;
  motion?: DrawerMotion;
  panelClassName?: string;
  bodyClassName?: string;
  wrapperClassName?: string;
  id?: string;
  labelledBy?: string;
  ariaLabel?: string;
  wrapperTestId?: string;
  overlayTestId?: string;
  colorScheme?: CSSProperties['colorScheme'];
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const SCOPE_DEFAULTS: Record<
  DrawerScope,
  { wrapper: string; panel: string; motion: DrawerMotion }
> = {
  fixed: {
    wrapper: 'tw-content fixed inset-0 z-60',
    panel:
      'fixed inset-y-0 inset-e-0 z-[61] w-[23rem] max-w-[calc(100vw-2.5rem)] shrink-0 flex-col overflow-x-hidden border-l border-border bg-paper shadow-xl',
    motion: 'spring',
  },
  absolute: {
    wrapper: 'absolute inset-0 z-30',
    panel:
      'absolute top-0 bottom-0 inset-e-0 z-40 w-[340px] max-w-full shrink-0 flex-col overflow-x-hidden border-l border-border bg-paper shadow-lg',
    motion: 'none',
  },
};

const panelMotionClass: Record<DrawerMotion, string> = {
  spring: 'beacon-spring transition-transform duration-300',
  'ease-out': 'transition-transform duration-200 ease-out',
  none: '',
};

const overlayMotionClass: Record<DrawerMotion, string> = {
  spring: 'transition-opacity duration-300',
  'ease-out': 'transition-opacity duration-200',
  none: '',
};

const Drawer = ({
  open,
  onClose,
  header,
  children,
  footer,
  scope = 'fixed',
  motion,
  panelClassName = '',
  bodyClassName = 'min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden',
  wrapperClassName = '',
  id,
  labelledBy,
  ariaLabel,
  wrapperTestId,
  overlayTestId,
  colorScheme,
}: DrawerProps) => {
  const defaults = SCOPE_DEFAULTS[scope];
  const resolvedMotion = motion ?? defaults.motion;
  const panelRef = useRef<HTMLElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      previousFocus.current?.focus();
      previousFocus.current = null;
      return undefined;
    }
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    requestAnimationFrame(() => {
      const panel = panelRef.current;
      (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const trapFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !open) return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const [first] = focusable;
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const wrapperClasses = [defaults.wrapper, wrapperClassName, open ? '' : 'pointer-events-none']
    .filter(Boolean)
    .join(' ');

  const panelStateClass =
    resolvedMotion === 'none'
      ? open
        ? 'visible'
        : 'invisible pointer-events-none'
      : open
        ? 'translate-x-0'
        : 'invisible pointer-events-none translate-x-full rtl:-translate-x-full';

  const panelClasses = [
    defaults.panel,
    panelMotionClass[resolvedMotion],
    panelClassName,
    panelStateClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-testid={wrapperTestId}
      className={wrapperClasses}
      style={colorScheme ? { colorScheme } : undefined}
    >
      <div
        data-testid={overlayTestId}
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 ${overlayMotionClass[resolvedMotion]} ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ backgroundColor: 'rgba(38, 30, 20, 0.18)' }}
      />
      <aside
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        aria-hidden={!open}
        onKeyDown={trapFocus}
        className={`flex ${panelClasses}`}
      >
        {header}
        <div className={bodyClassName}>{children}</div>
        {footer}
      </aside>
    </div>
  );
};

export type { DrawerProps, DrawerScope, DrawerMotion };
export { Drawer };
