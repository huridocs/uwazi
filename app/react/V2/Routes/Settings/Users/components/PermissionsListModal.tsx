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
  },
  {
    action: 'Create table of contents',
    admin: 'full',
    editor: 'full',
    collaborator: 'full',
  },
  {
    action: 'View entities',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
  },
  {
    action: 'Edit metadata of entities',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
  },
  {
    action: 'Delete entities and documents',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
  },
  {
    action: 'Share edit access with other users',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
  },
  {
    action: 'Create relationships and references',
    admin: 'full',
    editor: 'full',
    collaborator: 'partial',
  },
  {
    action: 'Share entities with the public',
    admin: 'full',
    editor: 'full',
    collaborator: 'none',
  },
  {
    action: 'Manage site settings and configuration',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Add/delete users and assign roles',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Configure filters',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Add/edit translations',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Configure templates ',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Create and edit thesauri',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
  },
  {
    action: 'Create relationship types',
    admin: 'full',
    editor: 'none',
    collaborator: 'none',
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

const columnHelper = createColumnHelper<PermissionByRole>();
const tableColumns = [
  columnHelper.accessor('action', {
    header: ActionHeader,
    enableSorting: false,
    meta: { className: 'w-2/5' },
  }),
  columnHelper.accessor('collaborator', {
    header: CollaboratorHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { className: 'w-1/5' },
  }),
  columnHelper.accessor('editor', {
    header: EditorHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { className: 'w-1/5' },
  }),
  columnHelper.accessor('admin', {
    header: AdminHeader,
    cell: LevelCell,
    enableSorting: false,
    meta: { className: 'w-1/5' },
  }),
];

const PermissionsListModal = ({ showModal, closeModal }: PermissionsListModalProps) =>
  showModal ? (
    <Modal size="xxxl">
      <Modal.Header>
        <Translate className="text-xl font-medium text-gray-900">Permissions</Translate>
        <Modal.CloseButton onClick={closeModal} />
      </Modal.Header>
      <Modal.Body>
        <Table<PermissionByRole> data={permissionsByRole} columns={tableColumns} />
      </Modal.Body>
      <Modal.Footer>
        <Button className="grow" styling="light" onClick={closeModal}>
          <Translate>Close</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  ) : null;

export { PermissionsListModal };
