/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { userAtom } from 'V2/atoms';
import { ClientUserSchema } from 'app/apiResponseTypes';
import { UserRole } from 'shared/types/userSchema';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { NeedAuthorization } from 'V2/Components/UI';
import { TestAtomStoreProvider } from 'V2/testing';
import { ClientEntitySchema } from 'app/istore';

describe('NeedAuthorization', () => {
  const editorUser = {
    _id: 'userId',
    role: UserRole.EDITOR,
    username: 'Editor',
    email: 'editor.com',
  };

  const adminUser = {
    _id: 'adminId',
    role: UserRole.ADMIN,
    username: 'Administrator',
    email: 'admin.com',
  };

  const collaborator = {
    _id: 'userId',
    username: 'collaborator',
    email: 'colab.com',
    role: UserRole.COLLABORATOR,
    groups: [
      {
        _id: 'groupId',
        name: 'g1',
      },
    ],
  };

  const writePermissions = [
    { refId: 'userId', level: AccessLevels.WRITE, type: PermissionType.USER },
  ];

  const renderComponet = ({
    user,
    roles,
    children,
    orWriteAccessTo,
  }: {
    user?: ClientUserSchema;
    roles?: string[];
    children?: ReactNode;
    orWriteAccessTo?: ClientEntitySchema[];
  }) =>
    render(
      <TestAtomStoreProvider initialValues={[[userAtom, user]]}>
        <NeedAuthorization roles={roles} orWriteAccessTo={orWriteAccessTo}>
          {children}
        </NeedAuthorization>
      </TestAtomStoreProvider>
    );

  describe('role based', () => {
    describe('when logged in', () => {
      it('should render children if user has role', () => {
        const result = renderComponet({
          user: editorUser,
          roles: ['admin', 'editor'],
          children: 'to render if auth',
        });
        expect(result.getByText('to render if auth')).toBeInTheDocument();
      });

      it('should NOT render children if user doesnt have role', () => {
        const result = renderComponet({
          user: editorUser,
          roles: ['admin'],
          children: 'to render if auth',
        });
        expect(result.queryByText('to render if auth')).not.toBeInTheDocument();
      });

      it('should use "admin" if no role provided', () => {
        const emptyResult = renderComponet({ user: editorUser, children: 'to render if auth' });
        expect(emptyResult.queryByText('to render if auth')).not.toBeInTheDocument();

        const resultForAdmin = renderComponet({ user: adminUser, children: 'to render if auth' });
        expect(resultForAdmin.getByText('to render if auth')).toBeInTheDocument();
      });
    });

    describe('when not logged in', () => {
      it('should not render children if no user', () => {
        const emptyResult = renderComponet({ children: 'to render if auth' });
        expect(emptyResult.queryByText('to render if auth')).not.toBeInTheDocument();
      });
    });
  });

  describe('access level based', () => {
    describe('write access', () => {
      it('should render children if user has write access to all entities entity', () => {
        const result = renderComponet({
          user: editorUser,
          children: 'to render if auth',
          roles: [],
          orWriteAccessTo: [
            {
              _id: 'someEntity',
              permissions: writePermissions,
            },
            {
              _id: 'otherEntity',
              permissions: writePermissions,
            },
          ],
        });
        expect(result.getByText('to render if auth')).toBeInTheDocument();
      });

      it('should not render children if user lacks write access to one or more entities', () => {
        const result = renderComponet({
          user: editorUser,
          children: 'to render if auth',
          roles: [],
          orWriteAccessTo: [
            {
              _id: 'someEntity',
              permissions: [
                {
                  refId: 'userId',
                  level: AccessLevels.READ,
                  type: PermissionType.USER,
                },
              ],
            },
            {
              refId: 'otherEntity',
              permissions: writePermissions,
            },
          ],
        });

        expect(result.queryByText('to render if auth')).not.toBeInTheDocument();
      });

      it('should not render children if entities has not permissions data', () => {
        const result = renderComponet({
          user: editorUser,
          children: 'to render if auth',
          roles: [],
          orWriteAccessTo: [
            {
              refId: 'someEntity',
            },
          ],
        });

        expect(result.queryByText('to render if auth')).not.toBeInTheDocument();
      });

      it('should render children if user has write access to all entities through groups', () => {
        const result = renderComponet({
          user: collaborator,
          children: 'to render if auth',
          roles: [],
          orWriteAccessTo: [
            {
              _id: 'someEntity',
              permissions: [
                {
                  refId: 'groupId',
                  level: AccessLevels.WRITE,
                  type: PermissionType.GROUP,
                },
              ],
            },
            {
              _id: 'otherEntity',
              permissions: writePermissions,
            },
          ],
        });

        expect(result.queryByText('to render if auth')).toBeInTheDocument();
      });

      it('should not render children if user lacks write access because of a group', () => {
        const result = renderComponet({
          user: collaborator,
          children: 'to render if auth',
          roles: [],
          orWriteAccessTo: [
            {
              _id: 'someEntity',
              permissions: [
                {
                  refId: 'groupId',
                  level: AccessLevels.READ,
                  type: PermissionType.GROUP,
                },
              ],
            },
            {
              _id: 'otherEntity',
              permissions: writePermissions,
            },
          ],
        });

        expect(result.queryByText('to render if auth')).not.toBeInTheDocument();
      });

      it('should not render children if entity is null', () => {
        const result = renderComponet({
          user: editorUser,
          children: 'to render if auth',
          roles: [],
          //@ts-ignore: no need to account for nulls in types
          orWriteAccessTo: [null],
        });

        expect(result.queryByText('to render if auth')).not.toBeInTheDocument();
      });
    });
  });

  describe('when providing roles and entities', () => {
    it('should render by entity permissions', () => {
      const result = renderComponet({
        user: editorUser,
        children: 'to render if auth',
        roles: ['admin'],
        orWriteAccessTo: [
          {
            _id: 'otherEntity',
            permissions: writePermissions,
          },
        ],
      });

      expect(result.queryByText('to render if auth')).toBeInTheDocument();
    });

    it('should render by role permissions', () => {
      const result = renderComponet({
        user: editorUser,
        children: 'to render if auth',
        roles: ['editor'],
        orWriteAccessTo: [
          {
            _id: 'someEntity',
            permissions: [
              {
                refId: 'someRandomId',
                level: AccessLevels.READ,
                type: PermissionType.USER,
              },
            ],
          },
        ],
      });

      expect(result.queryByText('to render if auth')).toBeInTheDocument();
    });
  });
});
