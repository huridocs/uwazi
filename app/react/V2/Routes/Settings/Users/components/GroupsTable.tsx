import React from 'react';
import { Translate } from 'app/I18N';
import { Button, Pill, Table } from 'app/V2/Components/UI';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';

interface GroupsTableProps {
  groups: ClientUserGroupSchema[];
  editButtonAction: (selectedGroup: ClientUserGroupSchema) => void;
  onGroupsSelected: (selectedGroups: ClientUserGroupSchema[]) => void;
}

const renderEditButton = (
  group: ClientUserGroupSchema,
  onclick: (group: ClientUserGroupSchema) => void
) => (
  <Button styling="outline" className="leading-4" onClick={() => onclick(group)}>
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

const GroupsTable = ({ groups, onGroupsSelected, editButtonAction }: GroupsTableProps) => {
  const groupsColumns = [
    {
      Header: <Translate className="capitalize">Name</Translate>,
      accessor: 'name',
      className: 'w-0',
    },
    {
      Header: <Translate className="capitalize">Members</Translate>,
      accessor: 'members',
      className: 'w-1/3',
      Cell: groupPill,
    },
    {
      Header: <Translate className="capitalize">Action</Translate>,
      accessor: '_id',
      Cell: ({ cell }: any) => renderEditButton(cell.row.original, editButtonAction),
      disableSortBy: true,
      className: 'w-0',
    },
  ];

  return (
    <Table
      columns={groupsColumns}
      data={groups}
      title={<Translate>Groups</Translate>}
      enableSelection
      onRowSelected={onGroupsSelected}
      initialState={{ sorting: [{ id: 'name', desc: false }] }}
    />
  );
};

export { GroupsTable };
