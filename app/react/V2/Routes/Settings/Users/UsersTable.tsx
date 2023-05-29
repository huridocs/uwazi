import React from 'react';
import { sortBy } from 'lodash';
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
  <Button styling="outline" onClick={() => onclick(user)} className="leading-4">
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
    {
      Header: <Translate className="capitalize">Usarname</Translate>,
      accessor: 'username',
      className: 'w-1/3',
    },
    {
      Header: <Translate className="capitalize">Protection</Translate>,
      accessor: 'using2fa',
      Cell: protectionPill,
      className: 'w-0',
    },
    {
      Header: <Translate className="capitalize">Role</Translate>,
      accessor: 'role',
      Cell: pill,
      className: 'text-center w-0',
    },
    {
      Header: <Translate className="capitalize">Group</Translate>,
      accessor: 'groups',
      Cell: groupPill,
      className: 'w-1/3',
    },
    {
      Header: <Translate className="capitalize">Action</Translate>,
      accessor: '_id',
      Cell: ({ cell }: any) => renderEditButton(cell.row.original, editButtonAction),
      disableSortBy: true,
      className: 'w-0',
    },
  ];

  const sortedUsers = sortBy(users, 'username');

  return (
    <Table
      columns={usersColumns}
      data={sortedUsers}
      title={<Translate>Users</Translate>}
      enableSelection
      onRowSelected={onUsersSelected}
    />
  );
};

export { UsersTable };
