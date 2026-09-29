import React, { useMemo, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { orderedSelectionIds } from '../librarySelection.js';
import { LibraryMultiEdit } from './LibraryMultiEdit.js';
import { LibrarySingleSelectActions } from './LibrarySingleSelectActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import { LibrarySelectionRow } from './LibrarySelectionRow.js';
import { useLibraryCardDisplay } from './useLibraryDisplay.js';

const LIST_STEP = 120;

type LibrarySelectionPanelProps = {
  rows: LibrarySearchHit[];
  selectedIds: readonly string[];
  entityBasePath: string;
  onClose: () => void;
  onRemove: (sharedId: string) => void;
  onPreview: (sharedId: string) => void;
  onAction?: (action: LibraryBulkAction) => void;
};

const LibrarySelectionPanel = ({
  rows,
  selectedIds,
  entityBasePath,
  onClose,
  onRemove,
  onPreview,
  onAction,
}: LibrarySelectionPanelProps) => {
  const { showThumbnail, showMetadata, thumbSize } = useLibraryCardDisplay();
  const [visible, setVisible] = useState(LIST_STEP);
  const [editKey, setEditKey] = useState('');
  const hits = useMemo(() => new Map(rows.map(row => [row.sharedId, row])), [rows]);
  const listedIds = orderedSelectionIds(
    rows.map(row => row.sharedId),
    selectedIds
  );
  const selectionKey = selectedIds.join('\0');

  if (editKey && editKey === selectionKey) {
    return (
      <LibraryMultiEdit
        hits={listedIds.flatMap(sharedId => {
          const hit = hits.get(sharedId);
          return hit ? [hit] : [];
        })}
        onCancel={() => setEditKey('')}
        onSaved={() => setEditKey('')}
      />
    );
  }

  return (
    <div
      data-testid="library-selection-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
    >
      <div
        data-part="header"
        className="flex shrink-0 items-center gap-2 px-3 py-3"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <span className="flex shrink-0 text-ink-tertiary" aria-hidden>
          <LibrarySelectionIcon name="check-square" size={15} />
        </span>
        <span className="truncate text-sm font-semibold text-ink">
          <Translate>Selection</Translate>
        </span>
        <span
          className="shrink-0 text-meta text-ink-tertiary tabular-nums"
          data-testid="library-selection-count"
        >
          {selectedIds.length.toLocaleString()}{' '}
          <Translate>{selectedIds.length === 1 ? 'entity' : 'entities'}</Translate>
        </span>
        <span className="ms-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('System', 'Close selection list', null, false)}
            data-gutter-align="box"
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
          >
            <LibrarySelectionIcon name="x" size={16} />
          </button>
        </span>
      </div>
      <div data-part="rows" className="min-h-0 flex-1 overflow-auto px-3 py-3">
        <ul className="flex flex-col gap-2" aria-label="Selected entities">
          {listedIds.slice(0, visible).map(sharedId => {
            const hit = hits.get(sharedId);
            return hit ? (
              <LibrarySelectionRow
                key={sharedId}
                hit={hit}
                entityBasePath={entityBasePath}
                showThumbnail={showThumbnail}
                showMetadata={showMetadata}
                thumbSize={thumbSize}
                onPreview={onPreview}
                onRemove={onRemove}
              />
            ) : null;
          })}
        </ul>
        {listedIds.length > visible ? (
          <div className="flex justify-center pt-3">
            <button
              type="button"
              onClick={() => setVisible(current => current + LIST_STEP)}
              className="cursor-pointer rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
            >
              <Translate>Show more</Translate>
              {` — ${(listedIds.length - visible).toLocaleString()} `}
              <Translate>remaining</Translate>
            </button>
          </div>
        ) : null}
      </div>
      <div
        data-part="footer"
        data-testid="library-selection-footer"
        className="flex h-12 shrink-0 items-center gap-2 bg-paper px-3"
        style={{ borderTop: '1px solid var(--border-primary)' }}
      >
        <LibrarySingleSelectActions
          includeViewEntity={false}
          onAction={onAction}
          onEdit={() => setEditKey(selectionKey)}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export type { LibrarySelectionPanelProps };
export { LibrarySelectionPanel };
