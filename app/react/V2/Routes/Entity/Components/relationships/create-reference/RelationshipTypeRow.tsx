/* eslint-disable react/no-multi-comp */
import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Trash2StrokeIcon } from '#V2/Components/CustomIcons/index.js';
import { Tooltip } from '#V2/Components/UI/index.js';

const nanoTooltipTheme = {
  base: 'absolute z-[110] inline-block rounded-md px-2 py-1 text-micro font-medium leading-snug',
};

const blockedTooltip = (inUse: boolean, count: number | undefined) => {
  if (inUse && count !== undefined && count > 0) {
    return t('System', 'Used in templates and {n} refs — cannot delete', null, false).replace(
      '{n}',
      String(count)
    );
  }
  if (inUse) return t('System', 'Used in templates — cannot delete', null, false);
  if (count !== undefined && count > 0) {
    return t('System', 'Used in {n} refs — cannot delete', null, false).replace(
      '{n}',
      String(count)
    );
  }
  return undefined;
};

type RelationshipTypeRowProps = {
  name: string;
  inUse: boolean;
  count: number | undefined;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

const trash = ({
  blocked,
  name,
  onAskDelete,
}: {
  blocked: boolean;
  name: string;
  onAskDelete: () => void;
}) => (
  <button
    type="button"
    disabled={blocked}
    aria-label={`Delete ${name}`}
    onClick={onAskDelete}
    className={
      blocked
        ? 'shrink-0 rounded p-1 text-ink-muted cursor-not-allowed opacity-40'
        : 'shrink-0 rounded p-1 text-ink-tertiary hover:bg-seal-tint hover:text-seal'
    }
  >
    <Trash2StrokeIcon className="h-3.5 w-3.5" aria-hidden="true" />
  </button>
);

const RelationshipTypeRowActions = ({
  name,
  onConfirmDelete,
  onCancelDelete,
}: {
  name: string;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) => (
  <div className="flex shrink-0 items-center gap-1">
    <button
      type="button"
      aria-label={`Delete ${name}`}
      onClick={onConfirmDelete}
      className="rounded-md bg-button-danger px-2 py-1 text-xs font-medium text-button-danger-fg hover:opacity-90"
    >
      <Translate>Delete</Translate>
    </button>
    <button
      type="button"
      aria-label={`Cancel deleting ${name}`}
      onClick={onCancelDelete}
      className="px-2 py-1 text-xs font-medium text-ink-secondary hover:text-ink"
    >
      <Translate>Cancel</Translate>
    </button>
  </div>
);

const RelationshipTypeRow = ({
  name,
  inUse,
  count,
  confirming,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: RelationshipTypeRowProps) => {
  const tooltip = blockedTooltip(inUse, count);
  const blocked = Boolean(tooltip);

  let actions = trash({ blocked, name, onAskDelete });
  if (!blocked && confirming) {
    actions = (
      <RelationshipTypeRowActions
        name={name}
        onConfirmDelete={onConfirmDelete}
        onCancelDelete={onCancelDelete}
      />
    );
  } else if (tooltip) {
    actions = (
      <Tooltip content={tooltip} placement="top" size="nano" theme={nanoTooltipTheme}>
        <span className="inline-flex shrink-0">{trash({ blocked, name, onAskDelete })}</span>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-warm">
      <span className="flex-1 truncate text-sm text-ink">{name}</span>
      {inUse && (
        <span className="shrink-0 rounded bg-vellum px-1.5 py-0.5 text-micro uppercase tracking-wide text-ink-tertiary">
          <Translate>In use</Translate>
        </span>
      )}
      {count !== undefined && (
        <span className="shrink-0 text-micro text-ink-tertiary tabular-nums">
          {count} <Translate>{count === 1 ? 'ref' : 'refs'}</Translate>
        </span>
      )}
      {actions}
    </div>
  );
};

export { RelationshipTypeRow };
