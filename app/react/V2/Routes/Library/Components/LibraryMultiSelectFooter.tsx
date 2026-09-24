import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { LibraryFooterDivider } from './LibraryFooterDivider.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import { LibrarySelectAllBox } from './LibrarySelectAllBox.js';

const barLeadClassName = 'text-ink font-medium hover:bg-warm';
const barGhostClassName = 'text-ink-secondary hover:bg-warm hover:text-ink';
const barDangerClassName = 'text-seal-label hover:bg-seal-tint/40';

const barButtonClassName =
  'shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3';

type BarTone = 'lead' | 'ghost' | 'danger';

type LibraryMultiSelectFooterProps = {
  count: number;
  loadedIds: readonly string[];
  selectedIds: readonly string[];
  onClear: () => void;
  onSelectLoaded: () => void;
  onDeselectLoaded: () => void;
  onAction?: (action: LibraryBulkAction) => void;
};

const barToneClass = (tone: BarTone) => {
  if (tone === 'lead') {
    return barLeadClassName;
  }
  if (tone === 'danger') {
    return barDangerClassName;
  }
  return barGhostClassName;
};

const actionTone = (action: LibrarySelectionAction): BarTone => {
  if (action.id === 'edit') {
    return 'lead';
  }
  if (action.danger) {
    return 'danger';
  }
  return 'ghost';
};

const LibraryMultiSelectFooter = ({
  count,
  loadedIds,
  selectedIds,
  onClear,
  onSelectLoaded,
  onDeselectLoaded,
  onAction,
}: LibraryMultiSelectFooterProps) => {
  const actions = librarySelectionActions();
  const leadActions = actions.filter(action => action.id !== 'delete');
  const deleteAction = actions.find(action => action.id === 'delete');
  const barButton = ({
    icon,
    label,
    tone,
    onClick,
  }: {
    icon: ReactNode;
    label: string;
    tone: BarTone;
    onClick?: () => void;
  }) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex ${barButtonClassName} ${barToneClass(tone)}`}
    >
      <span className={tone === 'danger' ? '' : 'text-ink-tertiary'}>{icon}</span>
      <span className="sm:inline">
        <Translate>{label}</Translate>
      </span>
    </button>
  );

  return (
    <div data-testid="library-multi-select-footer" className="w-full shrink-0">
      <div
        className="flex h-12 items-center gap-1 bg-paper px-3"
        style={{ borderTop: '1px solid var(--border-primary)' }}
      >
        <div data-testid="library-multi-select-actions" className="flex min-w-0 items-center">
          {leadActions.map(action =>
            barButton({
              icon: action.icon,
              label: action.label,
              tone: actionTone(action),
              onClick: () => onAction?.(action.id),
            })
          )}
          <LibraryFooterDivider />
          {deleteAction
            ? barButton({
                icon: deleteAction.icon,
                label: deleteAction.label,
                tone: 'danger',
                onClick: () => onAction?.(deleteAction.id),
              })
            : null}
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LibrarySelectAllBox
            loadedIds={loadedIds}
            selectedIds={selectedIds}
            onSelectLoaded={onSelectLoaded}
            onDeselectLoaded={onDeselectLoaded}
          />
          <span
            role="status"
            aria-live="polite"
            data-testid="library-selected-count"
            className="shrink-0 text-xs font-semibold text-ink tabular-nums"
          >
            {count.toLocaleString()} <Translate>selected</Translate>
          </span>
          {barButton({
            icon: <LibrarySelectionIcon name="x" size={13} />,
            label: 'Clear',
            tone: 'ghost',
            onClick: onClear,
          })}
        </div>
      </div>
    </div>
  );
};

export type { LibraryMultiSelectFooterProps };
export { LibraryMultiSelectFooter };
