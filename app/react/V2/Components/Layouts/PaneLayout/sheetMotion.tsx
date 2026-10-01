import React, { useEffect, useLayoutEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { SHEET_STACK } from './sheetStack.js';
import type { SheetLayer } from './useSheetLayer.js';

type SheetSnap = 'half' | 'full';

const SNAP_HALF_VH = 60;
const SNAP_FULL_VH = 92;
const HIT_44 = "relative after:absolute after:-inset-2.5 after:content-['']";

const bodyLock = { count: 0, previous: '' };

const lockBody = () => {
  if (bodyLock.count === 0) {
    bodyLock.previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLock.count += 1;
};

const unlockBody = () => {
  bodyLock.count = Math.max(0, bodyLock.count - 1);
  if (bodyLock.count === 0) {
    document.body.style.overflow = bodyLock.previous;
    bodyLock.previous = '';
  }
};

const systemLabel = (key: string) => {
  const value: unknown = t('System', key, null, false);
  return typeof value === 'string' ? value : key;
};

const closeText = (upper: boolean, named?: string) => {
  if (upper) return systemLabel('Close all');
  if (named) return `Close ${named}`;
  return systemLabel('Close');
};

const useSheetEffects = ({
  sheetRef,
  live,
  open,
  defaultSnap,
  setSnap,
  onClose,
}: {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  live: boolean;
  open: boolean;
  defaultSnap: SheetSnap;
  setSnap: (snap: SheetSnap) => void;
  onClose: () => void;
}) => {
  useLayoutEffect(() => {
    sheetRef.current?.toggleAttribute('inert', !live);
  }, [live, sheetRef]);

  useEffect(() => {
    if (open) setSnap(defaultSnap);
  }, [defaultSnap, open, setSnap]);

  useEffect(() => {
    if (!open) return undefined;
    lockBody();
    return unlockBody;
  }, [open]);

  useEffect(() => {
    if (!live) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [live, onClose]);
};

const pointerY = (event: React.PointerEvent<HTMLDivElement>) =>
  Number.isFinite(event.clientY) ? event.clientY : event.nativeEvent.clientY;

const capturePointer = (event: React.PointerEvent<HTMLDivElement>) => {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
    return true;
  } catch {
    return false;
  }
};

const sheetDrag = ({
  dragStartY,
  sheetRef,
  onClose,
  canGrow,
  setSnap,
}: {
  dragStartY: React.RefObject<number | null>;
  sheetRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  canGrow: boolean;
  setSnap: (snap: SheetSnap) => void;
}) => ({
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = pointerY(event);
    capturePointer(event);
  },
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const dy = pointerY(event) - dragStartY.current;
    if (Math.abs(dy) < 8) return;
    sheetRef.current.style.transition = 'none';
    sheetRef.current.style.transform = `translateY(${Math.max(0, dy)}px)`;
  },
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const dy = pointerY(event) - dragStartY.current;
    dragStartY.current = null;
    if (sheetRef.current) {
      sheetRef.current.style.transition = '';
      sheetRef.current.style.transform = '';
    }
    if (dy > 120) onClose();
    else if (dy < -60 && canGrow) setSnap('full');
  },
});

const sheetView = ({
  layer,
  snap,
  open,
  title,
  ariaLabel,
  onClose,
}: {
  layer: SheetLayer;
  snap: SheetSnap;
  open: boolean;
  title?: string;
  ariaLabel?: string;
  onClose: () => void;
}) => {
  const upper = open && layer.index > 0;
  const closeLabel = closeText(upper, title ?? ariaLabel);
  const back = upper ? (
    <button
      type="button"
      onClick={onClose}
      data-part="back"
      aria-label={
        layer.belowLabel ? `${systemLabel('Back to')} ${layer.belowLabel}` : systemLabel('Back')
      }
      className={`${HIT_44} shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-warm hover:text-ink`}
    >
      <ArrowLeftIcon className="h-4 w-4 rtl:rotate-180" aria-hidden />
    </button>
  ) : null;
  const stacked = layer.stacked && layer.count > 1;
  const snapVh = snap === 'full' ? SNAP_FULL_VH : SNAP_HALF_VH;
  const depth = Math.min(layer.depth, SHEET_STACK.visible - 1);
  const height =
    stacked && layer.index > 0 ? `calc(100dvh - ${layer.offsetRem}rem)` : `${snapVh}dvh`;
  const lift =
    stacked && layer.index === 0
      ? `translateY(calc(${layer.offsetRem}rem - ${100 - snapVh}dvh))`
      : 'translateY(0)';
  return {
    chrome: {
      back,
      close: upper ? layer.closeAll : onClose,
      pop: onClose,
      closeLabel,
      stacked: upper,
    },
    height,
    transform: open ? `${lift} scale(${1 - SHEET_STACK.scaleStep * depth})` : 'translateY(100%)',
  };
};

export type { SheetSnap };
export { useSheetEffects, sheetDrag, sheetView, HIT_44 };
