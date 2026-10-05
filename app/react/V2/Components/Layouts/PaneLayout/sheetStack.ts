import { atom } from 'jotai';

type SheetEntry = {
  id: string;
  order: number;
};

const sheetStackAtom = atom<SheetEntry[]>([]);

const SHEET_STACK = {
  base: 2.5,
  step: 0.75,
  visible: 4,
  scaleStep: 0.03,
} as const;

const SHEET_OVERLAY_ORDER = 100;

const sheetZ = (index: number) => 70 + index * 2;

export type { SheetEntry };
export { sheetStackAtom, SHEET_STACK, SHEET_OVERLAY_ORDER, sheetZ };
