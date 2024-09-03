/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Tooltip } from 'flowbite-react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { Translate, t } from 'app/I18N';
import { Button, Modal, Table } from 'app/V2/Components/UI';

type Level = 'none' | 'partial' | 'full';

interface PermissionByRole {
  action: string;
  admin: Level;
  editor: Level;
  collaborator: Level;
  rowId: string;
}

interface PermissionsListModalProps {
  showModal: boolean;
  closeModal: () => void;
}

const permissionsByRole: PermissionByRole[] = [
  {
    action: 'Create new entities and upload documents',
    admin: 'full',
    editor: 'full',
    collaborator: 'full',
    rowId: '1',
  },
  {
    action: 'Create table of contents',
    admin: 'full',
    editor: 'full',
    collaborator: 'full',
    rowId: '2',
  },
  {
    action: 'View entities',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
    rowId: '3',
  },
  {
    action: 'Edit metadata of entities',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
    rowId: '4',
  },
  {
    action: 'Delete entities and documents',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
    rowId: '5',
  },
  {
    action: 'Share edit access with other users',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
    rowId: '6',
  },
  {
    action: 'Create relationships and references',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
    rowId: '7',
  },
  {
    action: 'Share entities with the public',
    admin: 'full',
    editor: 'full',
    collaborator: 'none',
    rowId: '8',
  },
  {
    action: 'Manage site settings and configuration',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '9',
  },
  {
    action: 'Add/delete users and assign roles',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '10',
  },
  {
    action: 'Configure filters',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '11',
  },
  {
    action: 'Add/edit translations',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '12',
  },
  {
    action: 'Configure templates ',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '13',
  },
  {
    action: 'Create and edit thesauri',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '14',
  },
  {
    action: 'Create relationship types',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
    rowId: '15',
  },
];

const ActionHeader = () => <Translate>User Action</Translate>;
const CollaboratorHeader = () => <Translate>Collaborator</Translate>;
const EditorHeader = () => <Translate>Editor</Translate>;
const AdminHeader = () => <Translate>Admin</Translate>;

const LevelCell = ({ cell }: CellContext<PermissionByRole, Level>) => {
  switch (cell.getValue()) {
    case 'full':
      return <CheckIcon className="w-6 text-green-400" />;

    case 'partial':
      return (
        <Tooltip
          content={t(
            'System',
            'Permission on entities explicitly shared with the user',
            null,
            false
          )}
          // eslint-disable-next-line react/style-prop-object
          style="light"
        >
          <UserPlusIcon className="w-6 text-orange-400" />
        </Tooltip>
      );

    default:
      return <XMarkIcon className="w-6 text-pink-600" />;
  }
};

const ActionCell = ({ cell }: CellContext<PermissionByRole, string>) => (
  <Translate>{cell.getValue()}</Translate>
);

const columnHelper = createColumnHelper<PermissionByRole>();
const tableColumns = [
  columnHelper.accessor('action', {
    header: ActionHeader,
    cell: ActionCell,
    enableSorting: false,
    meta: { headerClassName: 'w-2/5' },
  }),
  columnHelper.accessor('collaborator', {
    header: CollaboratorHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { headerClassName: 'w-1/5' },
  }),
  columnHelper.accessor('editor', {
    header: EditorHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { headerClassName: 'w-1/5' },
  }),
  columnHelper.accessor('admin', {
    header: AdminHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { headerClassName: 'w-1/5' },
  }),
];

const PermissionsListModal = ({ showModal, closeModal }: PermissionsListModalProps) =>
  showModal ? (
    <Modal size="xxxl">
      <Modal.Header>
        <Translate className="text-xl font-medium text-gray-900">Permissions</Translate>
        <Modal.CloseButton onClick={closeModal} />
      </Modal.Header>
      <Modal.Body className="max-w-[100vw]">
        <Table data={permissionsByRole} columns={tableColumns} />
      </Modal.Body>
      <Modal.Footer>
        <Button className="grow" styling="light" onClick={closeModal}>
          <Translate>Close</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  ) : null;

export { PermissionsListModal };
