import { Translate } from 'app/I18N';
import { Button, Pill, Table } from 'app/V2/Components/UI';
import { ClientUserGroupSchema } from 'app/apiResponseTypes';
import React from 'react';

interface GroupsTableProps {
  groups: ClientUserGroupSchema[];
  editButtonAction: () => void;
  onGroupsSelected: (selectedGroups: ClientUserGroupSchema[]) => void;
}

const renderEditButton = (onClick: () => void) => (
  <Button buttonStyle="secondary" onClick={onClick}>
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
      Header: 'NAME',
      accessor: 'name',
      className: 'w-0',
    },
    {
      Header: 'MEMBERS',
      accessor: 'members',
      className: 'w-1/3',
      Cell: groupPill,
    },
    {
      Header: 'ACTION',
      accessor: '_id',
      Cell: renderEditButton(editButtonAction),
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
    />
  );
};

export { GroupsTable };
