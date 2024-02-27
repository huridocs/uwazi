/* eslint-disable react/no-multi-comp */
import React, { MouseEventHandler } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'flowbite-react';
import { Button, Pill } from 'app/V2/Components/UI';
import { t, Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const UsernameHeader = () => <Translate>Username</Translate>;
const GroupNameHeader = () => <Translate>Name</Translate>;
const ProtectionHeader = () => <Translate>Protection</Translate>;
const RoleHeader = () => <Translate>Role</Translate>;
const GroupsHeader = () => <Translate>Group</Translate>;
const MembersHeader = () => <Translate>Members</Translate>;

const ProtectionPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['using2fa']>) => {
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

const RolePill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['role']>) => {
  const value = cell.getValue();
  return (
    <div className="whitespace-nowrap">
      <Pill color={value === 'admin' ? 'primary' : 'gray'}>
        <Translate>{value}</Translate>
      </Pill>
    </div>
  );
};

const MembersPill = ({
  cell,
}: CellContext<ClientUserGroupSchema, ClientUserGroupSchema['members']>) => (
  <div className="flex flex-wrap gap-2">
    {cell.getValue().map(member => (
      <div key={member.username}>
        <Pill color="gray">{member.username}</Pill>
      </div>
    ))}
  </div>
);

const GroupsPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['groups']>) => (
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

const UsernameCell = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['username']>) => {
  const userIsBlocker = cell.row.original.accountLocked;
  return (
    <div className="flex items-start gap-1">
      <span className={userIsBlocker ? 'text-error-600' : ''}>{cell.getValue()}</span>
      {userIsBlocker && (
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
  <Button styling="outline" onClick={onClick} className="leading-4">
    <Translate>Edit</Translate>
  </Button>
);

const EditUserButton = ({ cell }: CellContext<ClientUserSchema, any>) => {
  const selectedUser = cell.row.original;
  return <EditButton onClick={() => cell.column.columnDef.meta?.action?.(selectedUser)} />;
};

const EditUserGroupButton = ({ cell }: CellContext<ClientUserGroupSchema, any>) => {
  const selectedUserGroup = cell.row.original;
  return <EditButton onClick={() => cell.column.columnDef.meta?.action?.(selectedUserGroup)} />;
};

const getUsersColumns = (editButtonAction: (user: ClientUserSchema) => void) => {
  const columnHelper = createColumnHelper<ClientUserSchema>();
  return [
    columnHelper.accessor('username', {
      header: UsernameHeader,
      cell: UsernameCell,
      meta: { headerClassName: 'w-1/3' },
    }),
    columnHelper.accessor('using2fa', {
      header: ProtectionHeader,
      cell: ProtectionPill,
      meta: { headerClassName: 'w-0' },
    }),
    columnHelper.accessor('role', {
      header: RoleHeader,
      cell: RolePill,
      meta: { headerClassName: 'w-0' },
    }),
    columnHelper.accessor('groups', {
      header: GroupsHeader,
      cell: GroupsPill,
      meta: { headerClassName: 'w-2/3' },
    }),
    columnHelper.display({
      id: '1',
      header: () => '',
      cell: EditUserButton,
      meta: { action: editButtonAction, headerClassName: 'sr-only' },
      enableSorting: false,
    }),
  ];
};

const getGroupsColumns = (editButtonAction: (group: ClientUserGroupSchema) => void) => {
  const columnHelper = createColumnHelper<ClientUserGroupSchema>();
  return [
    columnHelper.accessor('name', {
      header: GroupNameHeader,
      meta: { headerClassName: 'w-1/4' },
    }),
    columnHelper.accessor('members', {
      header: MembersHeader,
      cell: MembersPill,
      enableSorting: false,
      meta: { headerClassName: 'w-3/4' },
    }),
    columnHelper.display({
      id: '1',
      header: () => '',
      cell: EditUserGroupButton,
      meta: { action: editButtonAction, headerClassName: 'hidden' },
      enableSorting: false,
    }),
  ];
};

export { getUsersColumns, getGroupsColumns };
