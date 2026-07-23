/* eslint-disable react/no-multi-comp */
import React from 'react';
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccess, MixedAccessLevels } from '#shared/types/permissionSchema.js';
import { Tooltip } from '#V2/Components/UI/index.js';

type MemberRowProps = {
  member: MemberWithPermission;
  onChange: (level: MixedAccessLevels) => void;
  onRemove: () => void;
  showCanSee?: boolean;
};

const actionBtnClass = (active: boolean, disabled: boolean, danger = false) => {
  const base =
    'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30';
  if (disabled) return `${base} cursor-not-allowed text-ink-muted opacity-40`;
  if (danger) {
    return `${base} cursor-pointer text-ink-tertiary hover:bg-seal-tint hover:text-seal`;
  }
  if (active) return `${base} cursor-pointer bg-vellum text-ink`;
  return `${base} cursor-pointer text-ink-tertiary hover:bg-warm hover:text-ink-secondary`;
};

const ActionSlot = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center">{children}</div>
);

const IconAction = ({
  label,
  active = false,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <ActionSlot>
    <Tooltip content={label} placement="top">
      <button
        type="button"
        aria-label={label}
        aria-pressed={danger ? undefined : active}
        className={actionBtnClass(active, false, danger)}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  </ActionSlot>
);

const MemberRow = ({ member, onChange, onRemove, showCanSee = true }: MemberRowProps) => {
  const level = member.level ?? AccessLevels.READ;
  const isMixed = level === MixedAccess.MIXED;
  const canSee = level === AccessLevels.READ || isMixed;
  const canEdit = level === AccessLevels.WRITE || isMixed;
  const canSeeLabel = t('System', 'Can see', null, false);
  const canEditLabel = t('System', 'Can edit', null, false);

  return (
    <div className="flex items-center gap-3 px-1 pb-2.5">
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{member.label}</span>
      <div className="flex shrink-0 items-center">
        <div
          className="flex items-center gap-0.5"
          role="group"
          aria-label={t('System', 'Permission level', null, false)}
        >
          {showCanSee ? (
            <IconAction
              label={canSeeLabel}
              active={canSee && !isMixed}
              onClick={() => onChange(AccessLevels.READ)}
            >
              <EyeIcon className="h-4 w-4" aria-hidden />
            </IconAction>
          ) : null}
          <IconAction
            label={canEditLabel}
            active={canEdit && !isMixed}
            onClick={() =>
              onChange(showCanSee || !canEdit || isMixed ? AccessLevels.WRITE : AccessLevels.READ)
            }
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden />
          </IconAction>
        </div>
        <div className="ms-2 border-s border-border ps-2">
          <IconAction label={t('System', 'Remove', null, false)} danger onClick={onRemove}>
            <TrashIcon className="h-4 w-4" aria-hidden />
          </IconAction>
        </div>
      </div>
    </div>
  );
};

export type { MemberRowProps };
export { MemberRow };
