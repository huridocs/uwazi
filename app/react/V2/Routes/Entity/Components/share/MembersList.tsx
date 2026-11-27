/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { MixedAccessLevels } from '#shared/types/permissionSchema.js';
import { MemberMark } from './MemberMark.js';
import { MemberRow } from './MemberRow.js';
import { memberKey } from './shareUtils.js';

type MembersListProps = {
  loading: boolean;
  loadFailed: boolean;
  assignments: MemberWithPermission[];
  onChange: (index: number, level: MixedAccessLevels) => void;
  onRemove: (index: number) => void;
};

const StatusMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="px-1 py-6 text-center text-sm text-ink-muted">{children}</p>
);

const FixedAccessRow = () => (
  <div className="flex items-center gap-3 px-1 py-2.5">
    <MemberMark type="group" />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-xs text-ink">
        <Translate>Administrators and Editors</Translate>
      </span>
      <Translate className="block text-meta text-ink-tertiary">Always</Translate>
    </span>
    <Translate className="shrink-0 text-meta font-medium text-ink-secondary">Can edit</Translate>
  </div>
);

const MembersList = ({
  loading,
  loadFailed,
  assignments,
  onChange,
  onRemove,
}: MembersListProps) => {
  if (loading) {
    return (
      <StatusMessage>
        <Translate>Loading</Translate>…
      </StatusMessage>
    );
  }

  if (loadFailed) {
    return (
      <StatusMessage>
        <Translate>An error occurred</Translate>
      </StatusMessage>
    );
  }

  return (
    <div className="divide-y">
      <FixedAccessRow />
      {assignments.map((member, index) => (
        <MemberRow
          key={memberKey(member)}
          member={member}
          onChange={level => onChange(index, level)}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
};

export type { MembersListProps };
export { MembersList };
