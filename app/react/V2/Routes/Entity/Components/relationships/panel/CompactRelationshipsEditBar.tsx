import React from 'react';
import { CheckIcon, MinusIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { Settings2StrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { Button, NeedAuthorization } from '#V2/Components/UI/index.js';
import { RelationshipIconTip } from './RelationshipIconTip.js';

const iconClass = 'h-3 w-3 shrink-0';

const iconButtonClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border-0 py-1.5 transition-colors focus:outline-hidden focus:[box-shadow:0_0_0_4px_var(--color-theme-control-ring)] disabled:cursor-not-allowed';

const warmIconClass = `${iconButtonClass} bg-warm px-1.5 text-ink-secondary hover:bg-parchment hover:text-ink disabled:bg-vellum disabled:text-ink-muted`;

const deleteIconClass = `${iconButtonClass} bg-transparent ps-0.5 pe-1.5 text-seal hover:bg-seal-tint disabled:opacity-60`;

type CompactRelationshipsEditBarProps = {
  hasSelection: boolean;
  allSelected: boolean;
  selectedCount: number;
  totalCount: number;
  isDeleting: boolean;
  onCreate: () => void;
  onManageTypes: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

const CompactRelationshipsEditBar = ({
  hasSelection,
  allSelected,
  selectedCount,
  totalCount,
  isDeleting,
  onCreate,
  onManageTypes,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onCancel,
}: CompactRelationshipsEditBarProps) => {
  const createLabel = t('System', 'Create relationship', null, false);
  const manageLabel = t('System', 'Manage types', null, false);
  const selectLabel = t('System', 'Select all', null, false);
  const deselectLabel = t('System', 'Deselect all', null, false);
  const deleteLabel = t('System', 'Delete', null, false);

  return (
    <div className="flex w-full flex-nowrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <RelationshipIconTip label={createLabel} className={warmIconClass} onClick={onCreate}>
          <PlusIcon className={iconClass} aria-hidden />
        </RelationshipIconTip>
        <NeedAuthorization roles={['admin']}>
          <RelationshipIconTip
            label={manageLabel}
            className={warmIconClass}
            onClick={onManageTypes}
          >
            <Settings2StrokeIcon className={`${iconClass} text-ink-tertiary`} aria-hidden />
          </RelationshipIconTip>
        </NeedAuthorization>
        <RelationshipIconTip
          label={selectLabel}
          className={warmIconClass}
          disabled={totalCount === 0 || allSelected}
          onClick={onSelectAll}
        >
          <CheckIcon className={iconClass} aria-hidden />
        </RelationshipIconTip>
        <RelationshipIconTip
          label={deselectLabel}
          className={warmIconClass}
          disabled={!hasSelection}
          onClick={onDeselectAll}
        >
          <MinusIcon className={iconClass} aria-hidden />
        </RelationshipIconTip>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {hasSelection && (
          <div className="flex items-center gap-0.5">
            <span className="text-xs text-ink-secondary">
              <Translate>Selected</Translate> {selectedCount} <Translate>of</Translate> {totalCount}
            </span>
            <RelationshipIconTip
              label={deleteLabel}
              className={deleteIconClass}
              disabled={isDeleting}
              onClick={onDelete}
            >
              <TrashIcon className={iconClass} aria-hidden />
            </RelationshipIconTip>
          </div>
        )}
        <Button variant="warm" onClick={onCancel} disabled={isDeleting}>
          <Translate>Cancel</Translate>
        </Button>
      </div>
    </div>
  );
};

export { CompactRelationshipsEditBar };
