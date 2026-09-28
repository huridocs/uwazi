import type { SelectionRectangle } from '@huridocs/react-text-selection-handler';

const CLEAR_OFFSET_X = 6;
const CLEAR_OFFSET_Y = 8;

type ClearControlAnchor = { x: number; y: number };

const clearControlAnchor = (rectangle: SelectionRectangle): ClearControlAnchor => ({
  x: rectangle.left + rectangle.width - CLEAR_OFFSET_X,
  y: Math.max(0, rectangle.top - CLEAR_OFFSET_Y),
});

export type { ClearControlAnchor };
export { clearControlAnchor, CLEAR_OFFSET_X, CLEAR_OFFSET_Y };
