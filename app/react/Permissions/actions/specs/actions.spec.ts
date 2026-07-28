import { Dispatch } from 'redux';
import { IStore } from '#app/istore.js';
import { notificationActions } from '#app/Notifications/index.js';
import { PermissionsDataSchema } from '#shared/types/permissionType.js';
import {
  REMOVE_DOCUMENTS_SHAREDIDS,
  UPDATE_DOCUMENTS_PUBLISHED,
} from '#app/Library/actions/actionTypes.js';
import { PUBLIC_PERMISSION } from '#api/permissions/publicPermission.js';
import * as api from '../../PermissionsAPI.js';
import * as actions from '../actions.js';

describe('Permissions actions', () => {
  let dispatch: Dispatch<IStore>;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'savePermissions').and.callFake(async param => Promise.resolve(param));
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  const getStateMock = (state?: any) => () =>
    <IStore>state || {
      library: {
        search: {},
      },
    };

  describe('Save permissions', () => {
    it('should dispatch a notification of success', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['sharedId1'],
        permissions: [],
      };
      await actions.saveEntitiesPermissions(permissionsData, 'library')(dispatch, getStateMock());
      expect(notificationActions.notify).toHaveBeenCalledWith('Update success', 'success');
    });

    it.each([
      { unpublished: false, includeUnpublished: false, permissions: [{ ...PUBLIC_PERMISSION, level: 'read' }] },
      { unpublished: true, includeUnpublished: false, permissions: [] },
    ])(
      'should not remove nor update documents if publishing/unpublishing status not changing',
      async ({ unpublished, includeUnpublished, permissions }) => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['sharedId1'],
          permissions,
        };

        const stateLibrary = {
          library: {
            search: {
              unpublished,
              includeUnpublished,
            },
          },
        };

        await actions.saveEntitiesPermissions(permissionsData, 'library')(
          dispatch,
          getStateMock(stateLibrary)
        );

        expect(dispatch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: REMOVE_DOCUMENTS_SHAREDIDS,
            sharedIds: ['sharedId1'],
          })
        );
        expect(dispatch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: UPDATE_DOCUMENTS_PUBLISHED,
            sharedIds: ['sharedId1'],
          })
        );
      }
    );

    it.each([true, false])(
      'should not remove nor update documents if public permission has mixed access',
      async unpublished => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['sharedId1'],
          permissions: [{ ...PUBLIC_PERMISSION, level: 'mixed' }],
        };

        const stateLibrary = {
          library: {
            search: {
              unpublished,
              includeUnpublished: false,
            },
          },
        };

        await actions.saveEntitiesPermissions(permissionsData, 'library')(
          dispatch,
          getStateMock(stateLibrary)
        );

        expect(dispatch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: REMOVE_DOCUMENTS_SHAREDIDS,
            sharedIds: ['sharedId1'],
          })
        );
        expect(dispatch).not.toHaveBeenCalledWith(
          expect.objectContaining({
            type: UPDATE_DOCUMENTS_PUBLISHED,
            sharedIds: ['sharedId1'],
          })
        );
      }
    );

    it('should not fail and only dispatch a notification if no storekey', async () => {
      const permissionsData: PermissionsDataSchema = {
        ids: ['sharedId1'],
        permissions: [],
      };
      await actions.saveEntitiesPermissions(permissionsData)(dispatch, getStateMock());
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: REMOVE_DOCUMENTS_SHAREDIDS,
          sharedIds: ['sharedId1'],
        })
      );
      expect(dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: UPDATE_DOCUMENTS_PUBLISHED,
          sharedIds: ['sharedId1'],
        })
      );
    });

    describe('for LIBRARY', () => {
      it('should remove documents after unpublishing', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['sharedId1'],
          permissions: [],
        };

        const stateLibrary = {
          library: {
            search: {
              unpublished: false,
              includeUnpublished: false,
            },
          },
        };

        await actions.saveEntitiesPermissions(permissionsData, 'library')(
          dispatch,
          getStateMock(stateLibrary)
        );

        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: REMOVE_DOCUMENTS_SHAREDIDS,
            sharedIds: ['sharedId1'],
          })
        );
      });

      it.each([true, false])(
        'should update documents publishing after change if including unpublished',
        async withPublic => {
          const permissionsData: PermissionsDataSchema = {
            ids: ['sharedId1'],
            permissions: withPublic ? [{ ...PUBLIC_PERMISSION, level: 'read' }] : [],
          };

          const stateLibrary = {
            library: {
              search: {
                unpublished: false,
                includeUnpublished: true,
              },
            },
          };

          await actions.saveEntitiesPermissions(permissionsData, 'library')(
            dispatch,
            getStateMock(stateLibrary)
          );

          expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
              type: UPDATE_DOCUMENTS_PUBLISHED,
              sharedIds: ['sharedId1'],
              published: withPublic,
            })
          );

          expect(dispatch).not.toHaveBeenCalledWith(
            expect.objectContaining({
              type: REMOVE_DOCUMENTS_SHAREDIDS,
            })
          );
        }
      );

      it('should remove documents after publishing when viewing unpublished only', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['sharedId1'],
          permissions: [{ ...PUBLIC_PERMISSION, level: 'read' }],
        };

        const stateLibrary = {
          library: {
            search: {
              unpublished: true,
            },
          },
        };

        await actions.saveEntitiesPermissions(permissionsData, 'library')(
          dispatch,
          getStateMock(stateLibrary)
        );

        expect(dispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: REMOVE_DOCUMENTS_SHAREDIDS,
            sharedIds: ['sharedId1'],
          })
        );
      });
    });
  });
});
