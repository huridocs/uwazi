import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import type { SelectionRectangle, TextSelection } from '@huridocs/react-text-selection-handler';
import { clearControlAnchor } from './functions/clearControlAnchor.js';
import { mergeLineRectangles } from './functions/mergeLineRectangles.js';

const HIGHLIGHT_PAD_X = 8;
const HIGHLIGHT_PAD_Y = 2;
const HIGHLIGHT_OPACITY = 0.22;
const HIGHLIGHT_FILL = 'var(--color-carbon, #00b4f0)';

type WordSelectionHighlightProps = {
  preview?: TextSelection;
  committed?: TextSelection;
  regionId?: string;
  onClear?: () => void;
};

type LayeredRectangle = SelectionRectangle & { layer: 'preview' | 'committed' };

const visibleRectangles = (
  selection: TextSelection | undefined,
  regionId?: string
): SelectionRectangle[] =>
  (selection?.selectionRectangles || []).filter(rectangle =>
    rectangle.regionId && regionId ? rectangle.regionId === regionId : true
  );

const layeredRectangles = (
  selection: TextSelection | undefined,
  regionId: string | undefined,
  layer: LayeredRectangle['layer']
): LayeredRectangle[] =>
  mergeLineRectangles(visibleRectangles(selection, regionId)).map(rectangle => ({
    ...rectangle,
    layer,
  }));

const paddedStyle = (rectangle: SelectionRectangle): React.CSSProperties => ({
  top: rectangle.top - HIGHLIGHT_PAD_Y,
  left: rectangle.left - HIGHLIGHT_PAD_X,
  width: rectangle.width + HIGHLIGHT_PAD_X * 2,
  height: rectangle.height + HIGHLIGHT_PAD_Y * 2,
  backgroundColor: HIGHLIGHT_FILL,
});

const WordSelectionHighlight = ({
  preview,
  committed,
  regionId,
  onClear,
}: WordSelectionHighlightProps) => {
  const rectangles = [
    ...layeredRectangles(preview, regionId, 'preview'),
    ...layeredRectangles(committed, regionId, 'committed'),
  ];
  const committedRects = visibleRectangles(committed, regionId);
  const lastVisible = committedRects[committedRects.length - 1];
  const lastOverall = (committed?.selectionRectangles || []).at(-1);
  const clearAnchor = lastVisible ? clearControlAnchor(lastVisible) : undefined;
  const showClear =
    Boolean(onClear) &&
    Boolean(lastVisible) &&
    lastOverall?.regionId === lastVisible?.regionId &&
    lastOverall?.top === lastVisible?.top &&
    lastOverall?.left === lastVisible?.left;

  if (!rectangles.length && !showClear) {
    return null;
  }

  return (
    <>
      <div
        data-word-highlight-layer=""
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        style={{ opacity: HIGHLIGHT_OPACITY }}
      >
        {rectangles.map(rectangle => (
          <div
            key={`${rectangle.layer}-${rectangle.top}-${rectangle.left}-${rectangle.width}`}
            data-word-highlight=""
            className="absolute rounded-sm"
            style={paddedStyle(rectangle)}
          />
        ))}
      </div>
      {showClear && lastVisible && onClear ? (
        <button
          type="button"
          aria-label="Clear selection"
          onMouseDown={event => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
          className="absolute z-20 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-parchment shadow-sm"
          style={{ top: clearAnchor?.y, left: clearAnchor?.x }}
        >
          <XMarkIcon className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </>
  );
};

export type { WordSelectionHighlightProps };
export { WordSelectionHighlight };
