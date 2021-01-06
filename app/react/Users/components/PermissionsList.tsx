import React from 'react';
import { Translate } from 'app/I18N';
import { Icon } from 'UI';

export interface PermissionsListProps {
  userRole: string;
}

const permissionsByRole = [
  {
    label: 'Create new entities and upload documents',
    roles: { admin: 'full', editor: 'full', collaborator: 'full' },
  },
  {
    label: 'Create table of contents',
    roles: { admin: 'full', editor: 'full', collaborator: 'full' },
  },
  {
    label: 'View entities',
    roles: { admin: 'full', editor: 'full', collaborator: 'partial' },
  },
  {
    label: 'Edit metadata of entities',
    roles: { admin: 'full', editor: 'full', collaborator: 'partial' },
  },
  {
    label: 'Delete entities and documents',
    roles: { admin: 'full', editor: 'full', collaborator: 'partial' },
  },
  {
    label: 'Share edit access with other users',
    roles: { admin: 'full', editor: 'full', collaborator: 'partial' },
  },
  {
    label: 'Share entities with the public',
    roles: { admin: 'full', editor: 'full', collaborator: 'none' },
  },
  {
    label: 'Create connections and references',
    roles: { admin: 'full', editor: 'full', collaborator: 'none' },
  },
  {
    label: 'Manage site settings and configuration',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Add/delete users and assign roles',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Configure filters',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Add/edit translations',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Configure templates ',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Create and edit thesauri',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
  {
    label: 'Create connection types',
    roles: { admin: 'full', editor: 'none', collaborator: 'none' },
  },
];

const permissionIcons = {
  full: { icon: 'check', className: 'label-success' },
  partial: { icon: 'user-check', className: 'label-info' },
  none: { icon: 'times', className: 'label-warning' },
};

type PermissionCellParams = 'full' | 'partial' | 'none';
type userRoles = 'collaborator' | 'editor' | 'admin';

export const PermissionsList = (props: PermissionsListProps) => (
  <table className="permissions-list">
    <thead>
      <tr>
        <th>
          <Translate>Permission</Translate>
        </th>
        <th>
          <Translate>Collaborator</Translate>
        </th>
        <th>
          <Translate>Editor</Translate>
        </th>
        <th>
          <Translate>Admin</Translate>
        </th>
      </tr>
    </thead>
    <tbody>
      {permissionsByRole.map(permission => (
        <tr>
          <td>{permission.label}</td>
          {['collaborator', 'editor', 'admin'].map(role => {
            const roleIcon =
              permissionIcons[permission.roles[role as userRoles] as PermissionCellParams];
            return (
              <td>
                <Icon icon={roleIcon.icon} className={roleIcon.className} />
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);
