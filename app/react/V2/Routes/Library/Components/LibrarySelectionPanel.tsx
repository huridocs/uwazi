import React, { useMemo, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { orderedSelectionIds } from '../librarySelection.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import { LibrarySelectionRow } from './LibrarySelectionRow.js';
import { useLibraryCardDisplay } from './useLibraryDisplay.js';

const LIST_STEP = 120;

const closeButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center rounded-md px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm hover:text-ink';

const leadButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-warm';

const ghostButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-warm hover:text-ink';

const dangerButtonClassName =
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-seal-label transition-colors hover:bg-seal-tint/40';

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
  const hits = useMemo(() => new Map(rows.map(row => [row.sharedId, row])), [rows]);
  const listedIds = orderedSelectionIds(
    rows.map(row => row.sharedId),
    selectedIds
  );
  const shownIds = listedIds.slice(0, visible);
  const actions = librarySelectionActions();
  const actionById = (id: LibraryBulkAction) => actions.find(action => action.id === id);
  const count = selectedIds.length;

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
          {count.toLocaleString()} <Translate>{count === 1 ? 'entity' : 'entities'}</Translate>
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
          {shownIds.map(sharedId => {
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
        <button type="button" onClick={() => onAction?.('edit')} className={leadButtonClassName}>
          <span className="text-ink-tertiary">{actionById('edit')?.icon}</span>
          <Translate>Edit</Translate>
        </button>
        <button
          type="button"
          onClick={() => onAction?.('permissions')}
          className={ghostButtonClassName}
        >
          <span className="text-ink-tertiary">{actionById('permissions')?.icon}</span>
          <Translate>Permissions</Translate>
        </button>
        <span
          aria-hidden
          data-testid="library-selection-divider"
          className="mx-1.5 h-5 w-px shrink-0 self-center bg-border-soft"
        />
        <button
          type="button"
          onClick={() => onAction?.('delete')}
          className={dangerButtonClassName}
        >
          <span>{actionById('delete')?.icon}</span>
          <Translate>Delete</Translate>
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          data-gutter-align="box"
          className={closeButtonClassName}
        >
          <Translate>Close</Translate>
        </button>
      </div>
    </div>
  );
};

export type { LibrarySelectionPanelProps };
export { LibrarySelectionPanel };
