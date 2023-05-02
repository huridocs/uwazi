import React from 'react';
import { IncomingHttpHeaders } from 'http';
import { Tab, Tabs } from 'app/V2/Components/UI';
import { Checkbox } from 'flowbite-react';

import 'react-tabs/style/react-tabs.css';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import { Button, Pill, Table } from 'app/V2/Components/UI';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import * as usersAPI from 'V2/api/users';

const renderEditButton = () => (
  <Button buttonStyle="secondary">
    <Translate>Edit</Translate>
  </Button>
);

const pill = ({ cell }: any) => (
  <div className="whitespace-nowrap">
    <Pill color={cell.value === 'admin' ? 'primary' : 'gray'}>
      <Translate>{cell.value}</Translate>
    </Pill>
  </div>
);

const groupPill = ({ cell }: any) => {
  return (
    <div>
      {cell.value.map((group: any) => (
        <Pill color="gray">
          <Translate>{group.name}</Translate>
        </Pill>
      ))}
    </div>
  );
};

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

const selectRowComponent = ({ cell }: any) => {
  return <Checkbox />;
};

const columns = [
  {
    Header: '',
    accessor: 'select',
    className: 'w-0',
    Cell: selectRowComponent,
    disableSortBy: true,
  },
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
    Cell: renderEditButton,
    disableSortBy: true,
    className: 'w-0',
  },
];

const Users = () => {
  const users = (useLoaderData() as ClientUserSchema[]) || [];
  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <div className="p-4">
        <Tabs>
          <Tab label="Users">
            <Table columns={columns} data={users} title={<Translate>Users</Translate>} />
          </Tab>
          <Tab label="Groups">
            <div>This is the groups tab</div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

const usersLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    const users = await usersAPI.get(headers);
    return users;
  };

export { Users, usersLoader };
