import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { REMOVE_DOCUMENTS_SHAREDIDS, UPDATE_DOCUMENTS_PUBLISHED } from 'app/Library/actions/actionTypes';
import * as api from '../../PermissionsAPI';
import * as actions from '../actions';

jest.mock('app/Users/components/usergroups/UserGroupsAPI');

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
            permissions: withPublic ? [{ refId: 'public', type: 'public', level: 'read' }] : [],
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
    });

    describe('for UPLOADS', () => {
      it('should remove documents after publishing', async () => {
        const permissionsData: PermissionsDataSchema = {
          ids: ['sharedId1'],
          permissions: [{ refId: 'public', type: 'public', level: 'read' }],
        };

        const stateUploads = {
          uploads: {
            search: {
              unpublished: true,
            },
          },
        };

        await actions.saveEntitiesPermissions(permissionsData, 'uploads')(
          dispatch,
          getStateMock(stateUploads)
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
