import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import type { MemberWithPermission } from '#shared/types/entityPermisions.js';
import { UsersStrokeIcon } from '#V2/Components/CustomIcons/index.js';

type MemberMarkProps = {
  type: MemberWithPermission['type'];
};

const MemberMark = ({ type }: MemberMarkProps) => {
  const group = type === 'group';
  return (
    <span
      aria-hidden
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-ink-secondary${
        group ? ' rounded-full ring-1 ring-inset ring-ink/20' : ''
      }`}
    >
      {group ? (
        <UsersStrokeIcon className="h-[11px] w-[11px]" />
      ) : (
        <UserIcon className="h-3.5 w-3.5" />
      )}
    </span>
  );
};

export type { MemberMarkProps };
export { MemberMark };
