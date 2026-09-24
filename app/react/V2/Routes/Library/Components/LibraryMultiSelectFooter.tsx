import React, { Fragment, useState, type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';
import { LibrarySelectionIcon } from './librarySelectionIcons.js';
import { LibrarySelectAllBox } from './LibrarySelectAllBox.js';
import { LibrarySelectionActionsSheet } from './LibrarySelectionActionsSheet.js';

const barLeadClassName = 'text-ink font-medium hover:bg-warm';
const barGhostClassName = 'text-ink-secondary hover:bg-warm hover:text-ink';
const barDangerClassName = 'text-seal-label hover:bg-seal-tint/40';

const barButtonClassName =
  'shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors @min-[56rem]:px-3';

type BarTone = 'lead' | 'ghost' | 'danger';

type LibraryMultiSelectFooterProps = {
  count: number;
  loadedIds: readonly string[];
  selectedIds: readonly string[];
  notShown: number;
  onClear: () => void;
  onShowList: () => void;
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
  notShown,
  onClear,
  onShowList,
  onSelectLoaded,
  onDeselectLoaded,
  onAction,
}: LibraryMultiSelectFooterProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const actions = librarySelectionActions();
  const barButton = ({
    icon,
    label,
    tone,
    onClick,
    phoneHidden = false,
  }: {
    icon: ReactNode;
    label: string;
    tone: BarTone;
    onClick?: () => void;
    phoneHidden?: boolean;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`${phoneHidden ? 'hidden sm:flex' : 'flex'} ${barButtonClassName} ${barToneClass(tone)}`}
    >
      <span className={tone === 'danger' ? '' : 'text-ink-tertiary'}>{icon}</span>
      <span className="hidden @min-[56rem]:inline">
        <Translate>{label}</Translate>
      </span>
    </button>
  );

  return (
    <div data-testid="library-multi-select-footer" className="@container w-full shrink-0">
      <div
        className="flex h-12 items-center gap-1 bg-paper px-3"
        style={{ borderTop: '1px solid var(--border-primary)' }}
      >
        {actions.map(action => (
          <Fragment key={action.id}>
            {action.danger ? (
              <span
                aria-hidden
                className="mx-1.5 hidden h-5 w-px shrink-0 self-center bg-border-soft sm:block"
              />
            ) : null}
            {barButton({
              icon: action.icon,
              label: action.label,
              tone: actionTone(action),
              onClick: () => onAction?.(action.id),
            })}
          </Fragment>
        ))}
        <span
          data-part="selection-end"
          className="ms-auto hidden shrink-0 items-center gap-1 sm:flex"
        >
          <span className={`me-2 inline-flex shrink-0 ${count >= 2 ? '' : 'invisible'}`}>
            <LibrarySelectAllBox
              loadedIds={loadedIds}
              selectedIds={selectedIds}
              onSelectLoaded={onSelectLoaded}
              onDeselectLoaded={onDeselectLoaded}
            />
          </span>
          <span className="relative flex w-[7.5rem] shrink-0 items-center text-xs leading-tight tabular-nums">
            <span role="status" aria-live="polite" className="flex min-w-0">
              <button
                type="button"
                data-testid="library-selected-count"
                onClick={onShowList}
                className="cursor-pointer truncate rounded-sm font-semibold text-ink hover:underline focus-visible:ring-1 focus-visible:ring-carbon/40 focus-visible:outline-none"
              >
                {count.toLocaleString()} <Translate>selected</Translate>
              </button>
            </span>
            {notShown > 0 ? (
              <span
                aria-live="polite"
                className="absolute start-0 top-full -mt-0.5 hidden text-meta leading-none sm:flex"
              >
                <button
                  type="button"
                  onClick={onShowList}
                  className="cursor-pointer rounded-sm whitespace-nowrap text-carbon hover:underline focus-visible:ring-1 focus-visible:ring-carbon/40 focus-visible:outline-none"
                >
                  {notShown.toLocaleString()} <Translate>not shown</Translate>
                </button>
              </span>
            ) : null}
          </span>
          {barButton({
            icon: <LibrarySelectionIcon name="x" size={13} />,
            label: 'Clear',
            tone: 'ghost',
            onClick: onClear,
            phoneHidden: true,
          })}
        </span>
        <span
          role="status"
          aria-live="polite"
          className="me-auto shrink-0 text-xs font-semibold text-ink tabular-nums sm:hidden"
        >
          {count.toLocaleString()} <Translate>selected</Translate>
        </span>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium sm:hidden ${barLeadClassName}`}
        >
          <span className="text-ink-tertiary" aria-hidden>
            <LibrarySelectionIcon name="more-horizontal" size={13} />
          </span>
          <Translate>Actions</Translate>
        </button>
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium sm:hidden ${barGhostClassName}`}
        >
          <span className="text-ink-tertiary">
            <LibrarySelectionIcon name="x" size={13} />
          </span>
          <Translate>Clear</Translate>
        </button>
        {sheetOpen ? (
          <LibrarySelectionActionsSheet
            count={count}
            actions={actions}
            onClose={() => setSheetOpen(false)}
            onAction={onAction}
          />
        ) : null}
      </div>
    </div>
  );
};

export type { LibraryMultiSelectFooterProps };
export { LibraryMultiSelectFooter };
