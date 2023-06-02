/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Button, Pill } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientUserSchema } from 'app/apiResponseTypes';

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

const GroupPill = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['groups']>) => (
  <div>
    {cell.getValue()?.map(group => (
      <Pill color="gray" key={group.name}>
        <Translate>{group.name}</Translate>
      </Pill>
    ))}
  </div>
);

const EditButton = ({ cell }: CellContext<ClientUserSchema, ClientUserSchema['_id']>) => {
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

const UserNameHeader = () => <Translate className="capitalize">Usarname</Translate>;
const ProtectionHeader = () => <Translate className="capitalize">Protection</Translate>;
const RoleHeader = () => <Translate className="capitalize">Role</Translate>;
const GroupsHeader = () => <Translate className="capitalize">Group</Translate>;
const ActionHeader = () => <Translate className="capitalize">Action</Translate>;

const columnHelper = createColumnHelper<ClientUserSchema>();

const getUsersColumns = (editButtonAction: (user: ClientUserSchema) => void) => [
  {
    ...columnHelper.accessor('username', {
      header: UserNameHeader,
    }),
    className: 'w-1/3',
  },
  {
    ...columnHelper.accessor('using2fa', {
      header: ProtectionHeader,
      cell: ProtectionPill,
    }),
    className: 'w-0',
  },
  {
    ...columnHelper.accessor('role', {
      header: RoleHeader,
      cell: RolePill,
    }),
    className: 'text-center w-0',
  },
  {
    ...columnHelper.accessor('groups', {
      header: GroupsHeader,
      cell: GroupPill,
    }),
    className: 'w-1/3',
  },
  {
    ...columnHelper.accessor('_id', {
      header: ActionHeader,
      cell: EditButton,
      meta: { action: editButtonAction },
      enableSorting: false,
    }),
    className: 'w-0',
  },
];

export { getUsersColumns };
