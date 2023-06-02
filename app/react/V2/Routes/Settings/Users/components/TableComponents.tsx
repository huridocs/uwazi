/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Button, Pill } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

const UserNameHeader = () => <Translate className="capitalize">Usarname</Translate>;
const GroupNameHeader = () => <Translate className="capitalize">Name</Translate>;
const ProtectionHeader = () => <Translate className="capitalize">Protection</Translate>;
const RoleHeader = () => <Translate className="capitalize">Role</Translate>;
const GroupsHeader = () => <Translate className="capitalize">Group</Translate>;
const ActionHeader = () => <Translate className="capitalize">Action</Translate>;
const MembersHeader = () => <Translate className="capitalize">Members</Translate>;

const ProtectionPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['using2fa']>) => {
  if (cell.getValue()) {
    return (
      <Pill color="gray">
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
      <div>
        <Pill color="gray" key={member.username}>
          {member.username}
        </Pill>
      </div>
    ))}
  </div>
);

const GroupsPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['groups']>) => (
  <div className="flex gap-1">
    {cell.getValue()?.map(group => (
      <div>
        <Pill color="gray" key={group.name}>
          {group.name}
        </Pill>
      </div>
    ))}
  </div>
);

const EditButton = ({ cell }: CellContext<any, any>) => {
  const selectedUser = cell.row.original;
  return (
    <Button
      styling="outline"
      onClick={() => cell.column.columnDef.meta?.action(selectedUser)}
      className="leading-4"
    >
      <Translate>Edit</Translate>
    </Button>
  );
};

const getUsersColumns = (editButtonAction: (user: ClientUserSchema) => void) => {
  const columnHelper = createColumnHelper<ClientUserSchema>();
  return [
    {
      ...columnHelper.accessor('username', {
        header: UserNameHeader,
      }),
      // className: 'w-1/3',
    },
    {
      ...columnHelper.accessor('using2fa', {
        header: ProtectionHeader,
        cell: ProtectionPill,
      }),
      // className: 'w-0',
    },
    {
      ...columnHelper.accessor('role', {
        header: RoleHeader,
        cell: RolePill,
      }),
      // className: 'text-center w-0',
    },
    {
      ...columnHelper.accessor('groups', {
        header: GroupsHeader,
        cell: GroupsPill,
      }),
      // className: 'w-1/3',
    },
    {
      ...columnHelper.display({
        id: '1',
        header: ActionHeader,
        cell: EditButton,
        meta: { action: editButtonAction },
        enableSorting: false,
      }),
      // className: 'w-0',
    },
  ];
};

const getGroupsTableColumns = (editButtonAction: (group: ClientUserGroupSchema) => void) => {
  const columnHelper = createColumnHelper<ClientUserGroupSchema>();
  return [
    {
      ...columnHelper.accessor('name', {
        header: GroupNameHeader,
      }),
      // className: 'w-auto',
    },
    {
      ...columnHelper.accessor('members', {
        header: MembersHeader,
        cell: MembersPill,
        enableSorting: false,
      }),
      // className: 'w-1/3',
    },
    {
      ...columnHelper.display({
        id: '1',
        header: ActionHeader,
        cell: EditButton,
        meta: { action: editButtonAction },
        enableSorting: false,
      }),
      // className: 'w-0',
    },
  ];
};

export { getUsersColumns, getGroupsTableColumns };
