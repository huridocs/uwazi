import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { AccessLevels, MixedAccess, MixedAccessLevels } from '#shared/types/permissionSchema.js';
import { MemberMark } from './MemberMark.js';
import {
  SegmentedControlItem,
  SegmentedControlRoot,
} from '#V2/Components/UI/SegmentedControl/index.js';

type MemberRowProps = {
  member: MemberWithPermission;
  published: boolean;
  onChange: (level: MixedAccessLevels) => void;
  onRemove: () => void;
};

const isAccessLevel = (value: string): value is AccessLevels =>
  value === AccessLevels.READ || value === AccessLevels.WRITE;

const MemberRow = ({ member, published, onChange, onRemove }: MemberRowProps) => {
  const level = member.level ?? AccessLevels.READ;
  const removeLabel = t('System', 'Remove', null, false);
  const viewTitle = published
    ? t('System', 'Anyone can view a published entity', null, false)
    : undefined;

  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <MemberMark type={member.type} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-ink">{member.label}</span>
        {member.level === MixedAccess.MIXED ? (
          <Translate className="block text-meta text-ink-tertiary">Mixed access</Translate>
        ) : null}
      </span>
      <div className="flex shrink-0 items-center">
        <SegmentedControlRoot
          ariaLabel={`${t('System', 'Permission level', null, false)}, ${member.label}`}
          size="md"
          value={level}
          onValueChange={next => {
            if (isAccessLevel(next)) onChange(next);
          }}
        >
          <SegmentedControlItem
            value={AccessLevels.READ}
            ariaLabel={t('System', 'Can view', null, false)}
            title={viewTitle}
            className="whitespace-nowrap px-2.5"
          >
            <Translate>Can view</Translate>
          </SegmentedControlItem>
          <SegmentedControlItem
            value={AccessLevels.WRITE}
            ariaLabel={t('System', 'Can edit', null, false)}
            className="whitespace-nowrap px-2.5"
          >
            <Translate>Can edit</Translate>
          </SegmentedControlItem>
        </SegmentedControlRoot>
        <div className="ms-2 border-s border-border ps-2">
          <button
            type="button"
            aria-label={removeLabel}
            title={removeLabel}
            onClick={onRemove}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-seal-tint hover:text-seal focus:outline-none focus-visible:ring-2 focus-visible:ring-carbon/30"
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};

export type { MemberRowProps };
export { MemberRow };
