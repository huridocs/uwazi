/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { MixedAccessLevels } from '#shared/types/permissionSchema.js';
import { MemberRow } from './MemberRow.js';
import { memberKey } from './shareUtils.js';

type MembersListProps = {
  loading: boolean;
  loadFailed: boolean;
  assignments: MemberWithPermission[];
  showCanSee: boolean;
  onChange: (index: number, level: MixedAccessLevels) => void;
  onRemove: (index: number) => void;
};

const StatusMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="px-1 py-6 text-center text-sm text-ink-muted">{children}</p>
);

const MembersList = ({
  loading,
  loadFailed,
  assignments,
  showCanSee,
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

  if (assignments.length === 0) {
    return (
      <StatusMessage>
        <Translate>No people or groups added yet</Translate>
      </StatusMessage>
    );
  }

  return (
    <div className="divide-y">
      {assignments.map((member, index) => (
        <MemberRow
          key={memberKey(member)}
          member={member}
          showCanSee={showCanSee}
          onChange={level => onChange(index, level)}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
};

export type { MembersListProps };
export { MembersList };
