import React, { useEffect, useRef } from 'react';

type LibrarySelectAllBoxProps = {
  loadedIds: readonly string[];
  selectedIds: readonly string[];
  onSelectLoaded: () => void;
  onDeselectLoaded: () => void;
};

const selectAllLabel = (all: boolean, beyond: number, picked: number) => {
  if (!all) {
    return 'Select all loaded entities';
  }
  if (beyond > 0) {
    const loaded = picked.toLocaleString();
    const rest = beyond.toLocaleString();
    return `Deselect the ${loaded} loaded entities; ${rest} more stay selected`;
  }
  return 'Deselect the loaded entities';
};

const LibrarySelectAllBox = ({
  loadedIds,
  selectedIds,
  onSelectLoaded,
  onDeselectLoaded,
}: LibrarySelectAllBoxProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const selected = new Set(selectedIds);
  const picked = loadedIds.filter(id => selected.has(id)).length;
  const all = loadedIds.length > 0 && picked === loadedIds.length;
  const mixed = picked > 0 && !all;
  const beyond = selectedIds.length - picked;
  const label = selectAllLabel(all, beyond, picked);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = mixed;
    }
  }, [mixed]);

  return (
    <input
      ref={ref}
      type="checkbox"
      data-component="Checkbox"
      data-part="select-all"
      checked={all}
      aria-checked={mixed ? 'mixed' : all}
      aria-label={label}
      onChange={() => undefined}
      onClick={event => {
        event.stopPropagation();
        if (loadedIds.length === 0) {
          event.preventDefault();
          return;
        }
        if (all) {
          onDeselectLoaded();
        } else {
          onSelectLoaded();
        }
      }}
      className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-ink"
    />
  );
};

export type { LibrarySelectAllBoxProps };
export { LibrarySelectAllBox };
