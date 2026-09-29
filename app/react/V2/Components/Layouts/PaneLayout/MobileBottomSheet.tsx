import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { sheetZ } from './sheetStack.js';
import { useSheetLayer } from './useSheetLayer.js';
import { HIT_44, sheetDrag, sheetView, useSheetEffects, type SheetSnap } from './sheetMotion.js';

type SheetChrome = {
  back: React.ReactNode;
  close: () => void;
  pop: () => void;
  closeLabel: string;
  stacked: boolean;
};

type MobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  order: number;
  title?: string;
  children: React.ReactNode | ((chrome: SheetChrome) => React.ReactNode);
  defaultSnap?: SheetSnap;
  bare?: boolean;
  ariaLabel?: string;
};

const MobileBottomSheet = ({
  open,
  onClose,
  order,
  title,
  children,
  defaultSnap = 'half',
  bare = false,
  ariaLabel,
}: MobileBottomSheetProps) => {
  const layer = useSheetLayer(open, { onClose, label: title ?? ariaLabel, order });
  const [snap, setSnap] = useState<SheetSnap>(defaultSnap);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const titleId = useId();
  useSheetEffects({
    sheetRef,
    live: open && layer.isTop,
    open,
    defaultSnap,
    setSnap,
    onClose,
  });
  const drag = sheetDrag({
    dragStartY,
    sheetRef,
    onClose,
    canGrow: snap === 'half' && layer.index <= 0,
    setSnap,
  });
  const { chrome, height, transform } = sheetView({
    layer,
    snap,
    open,
    title,
    ariaLabel,
    onClose,
  });

  return createPortal(
    <>
      <div
        data-part="backdrop"
        className="fixed inset-0 transition-opacity duration-[250ms] motion-reduce:transition-none"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--text-primary) 30%, transparent)',
          opacity: open && layer.index <= 0 ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          zIndex: sheetZ(Math.max(0, layer.index)),
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title && !bare ? titleId : undefined}
        aria-label={bare ? ariaLabel : undefined}
        data-part="sheet"
        data-snap={snap}
        data-layer={layer.index}
        className="fixed right-0 bottom-0 left-0 flex flex-col rounded-t-xl bg-(--color-theme-surface-raised) shadow-[0_-8px_24px_rgba(0,0,0,0.15)] transition-[transform,height] duration-[250ms] ease-out motion-reduce:transition-none"
        style={{
          height,
          transform,
          transformOrigin: 'top center',
          zIndex: sheetZ(Math.max(0, layer.index)) + 1,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          aria-hidden
          data-part="dim"
          className="pointer-events-none absolute inset-0 rounded-t-xl transition-opacity duration-[250ms] motion-reduce:transition-none"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
            opacity: open ? Math.min(layer.depth, 3) / 2 : 0,
            zIndex: 1,
          }}
        />
        <div
          data-part="handle"
          className="relative flex cursor-grab touch-none justify-center pt-2 pb-1 active:cursor-grabbing"
          onPointerDown={drag.onPointerDown}
          onPointerMove={drag.onPointerMove}
          onPointerUp={drag.onPointerUp}
          onPointerCancel={drag.onPointerUp}
        >
          <div
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: 'var(--color-theme-border-soft)' }}
          />
        </div>
        {!bare && (
          <div
            data-part="header"
            className="flex shrink-0 items-center justify-between gap-2 px-4 py-2"
            style={{ borderBottom: '1px solid var(--border-primary)' }}
          >
            {chrome.back}
            {title ? (
              <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {title}
              </h2>
            ) : (
              <div className="flex-1" />
            )}
            <button
              type="button"
              onClick={chrome.close}
              data-part="close"
              aria-label={chrome.closeLabel}
              className={`${HIT_44} inline-flex shrink-0 items-center gap-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-warm hover:text-ink`}
            >
              <XMarkIcon className="h-4 w-4" aria-hidden />
              {chrome.stacked ? <span>{chrome.closeLabel}</span> : null}
            </button>
          </div>
        )}
        <div
          data-part="body"
          className="min-h-0 flex-1 overflow-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {typeof children === 'function' ? children(chrome) : children}
        </div>
      </div>
    </>,
    document.body
  );
};

export type { MobileBottomSheetProps, SheetChrome, SheetSnap };
export { MobileBottomSheet };
