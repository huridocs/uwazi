import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import type { SelectionRectangle, TextSelection } from '@huridocs/react-text-selection-handler';

type WordSelectionHighlightProps = {
  selection: TextSelection;
  committed?: boolean;
  regionId?: string;
  onClear?: () => void;
};

const visibleRectangles = (selection: TextSelection, regionId?: string): SelectionRectangle[] =>
  (selection.selectionRectangles || []).filter(rectangle =>
    rectangle.regionId && regionId ? rectangle.regionId === regionId : true
  );

const WordSelectionHighlight = ({
  selection,
  committed = false,
  regionId,
  onClear,
}: WordSelectionHighlightProps) => {
  const rectangles = visibleRectangles(selection, regionId);
  const lastVisible = rectangles[rectangles.length - 1];
  const lastOverall = (selection.selectionRectangles || []).at(-1);
  const showClear =
    committed &&
    Boolean(onClear) &&
    Boolean(lastVisible) &&
    lastOverall?.regionId === lastVisible?.regionId &&
    lastOverall?.top === lastVisible?.top &&
    lastOverall?.left === lastVisible?.left;

  return (
    <>
      {rectangles.map(rectangle => (
        <div
          key={`${rectangle.top}-${rectangle.left}-${rectangle.width}`}
          data-word-highlight=""
          className="pointer-events-none absolute z-10 bg-highlight-blue"
          style={{
            top: rectangle.top,
            left: rectangle.left,
            width: rectangle.width,
            height: rectangle.height,
          }}
        />
      ))}
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
          style={{
            top: Math.max(0, lastVisible.top - 8),
            left: lastVisible.left + lastVisible.width - 6,
          }}
        >
          <XMarkIcon className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </>
  );
};

export type { WordSelectionHighlightProps };
export { WordSelectionHighlight };
