import React from 'react';
import { Button, Pill, Table } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientUserSchema } from 'app/apiResponseTypes';

interface UsersTableProps {
  users: ClientUserSchema[];
  editButtonAction: (userBeingEdited: ClientUserSchema) => void;
  onUsersSelected: (selectedUsers: ClientUserSchema[]) => void;
}

const protectionPill = ({ cell }: any) => {
  if (cell.value) {
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

const pill = ({ cell }: any) => (
  <div className="whitespace-nowrap">
    <Pill color={cell.value === 'admin' ? 'primary' : 'gray'}>
      <Translate>{cell.value}</Translate>
    </Pill>
  </div>
);

const renderEditButton = (user: ClientUserSchema, onclick: (user: ClientUserSchema) => void) => (
  <Button buttonStyle="secondary" onClick={() => onclick(user)}>
    <Translate>Edit</Translate>
  </Button>
);

const groupPill = ({ cell }: any) => (
  <div>
    {cell.value.map((group: any) => (
      <Pill color="gray" key={group.name}>
        <Translate>{group.name || group.username}</Translate>
      </Pill>
    ))}
  </div>
);

const UsersTable = ({ users, onUsersSelected, editButtonAction }: UsersTableProps) => {
  const usersColumns = [
    { Header: 'USERNAME', accessor: 'username', className: 'w-1/3', disableSortBy: true },
    { Header: 'PROTECTION', accessor: 'using2fa', Cell: protectionPill, className: 'w-0' },
    {
      Header: 'ROLE',
      accessor: 'role',
      Cell: pill,
      className: 'text-center w-0',
    },
    {
      Header: 'GROUP',
      accessor: 'groups',
      Cell: groupPill,
      disableSortBy: true,
      className: 'w-1/3',
    },
    {
      Header: 'ACTION',
      accessor: '_id',
      Cell: ({ cell }: any) => renderEditButton(cell.row.original, editButtonAction),
      disableSortBy: true,
      className: 'w-0',
    },
  ];

  return (
    <Table
      columns={usersColumns}
      data={users}
      title={<Translate>Users</Translate>}
      enableSelection
      onRowSelected={onUsersSelected}
    />
  );
};

export { UsersTable };
