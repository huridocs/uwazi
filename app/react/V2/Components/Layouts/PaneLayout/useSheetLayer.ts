import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useId, useLayoutEffect, useRef } from 'react';
import { SHEET_STACK, sheetStackAtom } from './sheetStack.js';

type SheetLayerOptions = {
  onClose?: () => void;
  label?: string;
  order: number;
};

type SheetLayer = {
  index: number;
  count: number;
  depth: number;
  isTop: boolean;
  stacked: boolean;
  offsetRem: number;
  belowLabel?: string;
  closeAll: () => void;
};

type RegisteredLayer = {
  close: () => void;
  label?: string;
};

const layerRegistry = new Map<string, RegisteredLayer>();

const layerMetrics = ({
  stack,
  id,
  open,
  closeAll,
}: {
  stack: { id: string; order: number }[];
  id: string;
  open: boolean;
  closeAll: () => void;
}): SheetLayer => {
  const index = open ? stack.findIndex(entry => entry.id === id) : -1;
  const count = stack.length;
  const depth = index < 0 ? 0 : count - 1 - index;
  const shown = Math.max(0, index - Math.max(0, count - SHEET_STACK.visible));
  return {
    index,
    count,
    depth,
    isTop: index < 0 || depth === 0,
    stacked: index >= 0,
    offsetRem: SHEET_STACK.base + SHEET_STACK.step * shown,
    belowLabel: index > 0 ? layerRegistry.get(stack[index - 1].id)?.label : undefined,
    closeAll,
  };
};

const useSheetLayer = (open: boolean, opts: SheetLayerOptions): SheetLayer => {
  const id = useId();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const stack = useAtomValue(sheetStackAtom);
  const setStack = useSetAtom(sheetStackAtom);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const { order } = optsRef.current;
    setStack(current => {
      const next = current.filter(entry => entry.id !== id);
      next.push({ id, order });
      next.sort((left, right) => left.order - right.order);
      return next;
    });
    layerRegistry.set(id, {
      close: () => optsRef.current.onClose?.(),
      get label() {
        return optsRef.current.label;
      },
    });
    return () => {
      layerRegistry.delete(id);
      setStack(current => current.filter(entry => entry.id !== id));
    };
  }, [id, open, opts.order, setStack]);

  const closeAll = useCallback(() => {
    [...stack].reverse().forEach(entry => {
      layerRegistry.get(entry.id)?.close();
    });
  }, [stack]);

  return layerMetrics({ stack, id, open, closeAll });
};

export type { SheetLayer, SheetLayerOptions };
export { useSheetLayer };
