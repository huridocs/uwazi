/* eslint-disable react/no-multi-comp */
import React, { MouseEventHandler } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Button, Pill } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const UserNameHeader = () => <Translate>Username</Translate>;
const GroupNameHeader = () => <Translate>Name</Translate>;
const ProtectionHeader = () => <Translate>Protection</Translate>;
const RoleHeader = () => <Translate>Role</Translate>;
const GroupsHeader = () => <Translate>Group</Translate>;
const ActionHeader = () => <Translate>Action</Translate>;
const MembersHeader = () => <Translate>Members</Translate>;

const ProtectionPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['using2fa']>) => {
  if (cell.getValue()) {
    return (
      <Pill color="green">
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
  <div className="flex gap-1">
    {cell.getValue().map(member => (
      <div key={member.username}>
        <Pill color="gray">{member.username}</Pill>
      </div>
    ))}
  </div>
);

const GroupsPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['groups']>) => (
  <div className="flex gap-1">
    {cell.getValue()?.map(group => (
      <div key={cell.id + group._id}>
        <Pill color="gray">{group.name}</Pill>
      </div>
    ))}
  </div>
);

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
      header: UserNameHeader,
      meta: { className: 'w-1/3' },
    }),
    columnHelper.accessor('using2fa', {
      header: ProtectionHeader,
      cell: ProtectionPill,
      meta: { className: 'w-0' },
    }),
    columnHelper.accessor('role', {
      header: RoleHeader,
      cell: RolePill,
      meta: { className: 'w-0' },
    }),
    columnHelper.accessor('groups', {
      header: GroupsHeader,
      cell: GroupsPill,
      meta: { className: 'w-2/3' },
    }),
    columnHelper.display({
      id: '1',
      header: ActionHeader,
      cell: EditUserButton,
      meta: { action: editButtonAction, className: 'w-0 text-center' },
      enableSorting: false,
    }),
  ];
};

const getGroupsColumns = (editButtonAction: (group: ClientUserGroupSchema) => void) => {
  const columnHelper = createColumnHelper<ClientUserGroupSchema>();
  return [
    columnHelper.accessor('name', {
      header: GroupNameHeader,
      meta: { className: 'w-1/4' },
    }),
    columnHelper.accessor('members', {
      header: MembersHeader,
      cell: MembersPill,
      enableSorting: false,
      meta: { className: 'w-3/4' },
    }),
    columnHelper.display({
      id: '1',
      header: ActionHeader,
      cell: EditUserGroupButton,
      meta: { action: editButtonAction, className: 'w-0 text-center' },
      enableSorting: false,
    }),
  ];
};

export { getUsersColumns, getGroupsColumns };
