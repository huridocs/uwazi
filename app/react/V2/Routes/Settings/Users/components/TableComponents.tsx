/* eslint-disable react/no-multi-comp */
import React, { MouseEventHandler } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'flowbite-react';
import { Button, Pill } from 'app/V2/Components/UI';
import { t, Translate } from 'app/I18N';
import { User, Group } from '../types';

const userColumns = createColumnHelper<User>();
const groupColumns = createColumnHelper<Group>();

const UsernameHeader = () => <Translate>Username</Translate>;
const GroupNameHeader = () => <Translate>Name</Translate>;
const ProtectionHeader = () => <Translate>Protection</Translate>;
const RoleHeader = () => <Translate>Role</Translate>;
const GroupsHeader = () => <Translate>Group</Translate>;
const MembersHeader = () => <Translate>Members</Translate>;
const ActionHeader = () => <Translate className="sr-only">Action</Translate>;

const ProtectionPill = ({ cell }: CellContext<User, User['using2fa']>) => {
  if (cell.getValue()) {
    return (
      <Pill color="green" className="whitespace-nowrap">
        <Translate>Password + 2fa</Translate>
      </Pill>
    );
  }
  return (
    <Pill color="gray">
      <Translate>Password</Translate>
    </Pill>
  );
};

const RolePill = ({ cell }: CellContext<User, User['role']>) => {
  const value = cell.getValue();
  return (
    <div className="whitespace-nowrap">
      <Pill color={value === 'admin' ? 'primary' : 'gray'}>
        <Translate>{value}</Translate>
      </Pill>
    </div>
  );
};

const MembersPill = ({ cell }: CellContext<Group, Group['members']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(member => (
      <div key={member.username}>
        <Pill color="gray">{member.username}</Pill>
      </div>
    ))}
  </div>
);

const GroupsPill = ({ cell }: CellContext<User, User['groups']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue()?.map(group => (
      <div key={cell.id + group._id}>
        <Pill color="gray" className="whitespace-nowrap">
          {group.name}
        </Pill>
      </div>
    ))}
  </div>
);

const UsernameCell = ({ cell }: CellContext<User, User['username']>) => {
  const userIsBlocked = cell.row.original.accountLocked;
  return (
    <div className="flex gap-1 items-start">
      <span className={userIsBlocked ? 'text-error-600' : ''}>{cell.getValue()}</span>
      {userIsBlocked && (
        <Tooltip
          content={t('System', 'Account locked', null, false)}
          // eslint-disable-next-line react/style-prop-object
          style="light"
        >
          <LockClosedIcon className="w-4 cursor-pointer text-error-600" />
        </Tooltip>
      )}
    </div>
  );
};

const EditButton = ({ onClick }: { onClick: MouseEventHandler }) => (
  <Button styling="light" onClick={onClick} className="leading-4">
    <Translate>Edit</Translate>
  </Button>
);

const EditUserButton = ({ cell }: CellContext<User, any>) => {
  const selectedUser = cell.row.original;
  return <EditButton onClick={() => cell.column.columnDef.meta?.action?.(selectedUser)} />;
};

const EditUserGroupButton = ({ cell }: CellContext<Group, any>) => {
  const selectedUserGroup = cell.row.original;
  return <EditButton onClick={() => cell.column.columnDef.meta?.action?.(selectedUserGroup)} />;
};

const getUsersColumns = (editButtonAction: (user: User) => void) => [
  userColumns.accessor('username', {
    header: UsernameHeader,
    cell: UsernameCell,
    meta: { headerClassName: 'w-1/3' },
  }),
  userColumns.accessor('using2fa', {
    header: ProtectionHeader,
    cell: ProtectionPill,
    meta: { headerClassName: 'w-0' },
  }),
  userColumns.accessor('role', {
    header: RoleHeader,
    cell: RolePill,
    meta: { headerClassName: 'w-0' },
  }),
  userColumns.accessor('groups', {
    header: GroupsHeader,
    cell: GroupsPill,
    meta: { headerClassName: 'w-2/3' },
  }),
  userColumns.display({
    id: '1',
    header: ActionHeader,
    cell: EditUserButton,
    meta: { action: editButtonAction },
    enableSorting: false,
  }),
];

const getGroupsColumns = (editButtonAction: (group: Group) => void) => [
  groupColumns.accessor('name', {
    header: GroupNameHeader,
    meta: { headerClassName: 'w-1/4' },
  }),
  groupColumns.accessor('members', {
    header: MembersHeader,
    cell: MembersPill,
    enableSorting: false,
    meta: { headerClassName: 'w-3/4' },
  }),
  groupColumns.display({
    id: '1',
    header: ActionHeader,
    cell: EditUserGroupButton,
    meta: { action: editButtonAction },
    enableSorting: false,
  }),
];

export { getUsersColumns, getGroupsColumns };
