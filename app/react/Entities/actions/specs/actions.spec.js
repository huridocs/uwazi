import { notificationActions } from 'app/Notifications';
import api from 'app/Entities/EntitiesAPI';
import { actions as relationshipActions } from 'app/Relationships';
import { RequestParams } from 'app/utils/RequestParams';

import * as saveEntityWithFiles from 'app/Library/actions/saveEntityWithFiles';
import * as actions from '../actions';

describe('Entities actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'delete').and.callFake(async () => Promise.resolve());
    spyOn(api, 'deleteMultiple').and.callFake(async () => Promise.resolve());
    spyOn(notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('saveEntity', () => {
    it('should dispatch a saving entity and save the data', done => {
      spyOn(relationshipActions, 'reloadRelationships').and.returnValue({
        type: 'reloadRelationships',
      });
      spyOn(saveEntityWithFiles, 'saveEntityWithFiles').and.returnValue({
        entity: { _id: 'newId', _rev: 'newRev', sharedId: 'sharedId' },
        errors: [],
      });

      actions
        .saveEntity('data')(dispatch)
        .then(() => {
          expect(saveEntityWithFiles.saveEntityWithFiles).toHaveBeenCalledWith('data', dispatch);
          expect(notificationActions.notify).toHaveBeenCalledWith('Entity saved', 'success');
          expect(dispatch).toHaveBeenCalledWith({
            type: 'entityView/entity/SET',
            value: { _id: 'newId', _rev: 'newRev', sharedId: 'sharedId' },
          });
          expect(dispatch).toHaveBeenCalledWith({
            type: 'rrf/reset',
            model: 'entityView.entityForm',
          });
          expect(dispatch).toHaveBeenCalledWith({ type: 'reloadRelationships' });
          expect(relationshipActions.reloadRelationships).toHaveBeenCalledWith('sharedId');
          done();
        });
    });

    it('should dispatch a warning if there are errors while saving files', async () => {
      spyOn(relationshipActions, 'reloadRelationships').and.returnValue({
        type: 'reloadRelationships',
      });
      spyOn(saveEntityWithFiles, 'saveEntityWithFiles').and.returnValue({
        entity: 'data',
        errors: ['file1 save error'],
      });

      await actions.saveEntity('data')(dispatch);
      expect(notificationActions.notify).toHaveBeenCalledWith(
        expect.stringContaining('Entity saved with the following errors:'),
        'warning'
      );
    });
  });

  describe('deleteEntity', () => {
    it('should delete the entity and notify', done => {
      actions
        .deleteEntity({ sharedId: 'sharedId' })(dispatch)
        .then(() => {
          expect(api.delete).toHaveBeenCalledWith(new RequestParams({ sharedId: 'sharedId' }));
          expect(notificationActions.notify).toHaveBeenCalledWith('Entity deleted', 'success');
          done();
        })
        .catch(done.fail);
    });
  });

  describe('deleteEntities', () => {
    it('should delete the entities and notify', async () => {
      await actions.deleteEntities([{ sharedId: 'entity1' }, { sharedId: 'entity2' }])(dispatch);
      expect(api.deleteMultiple).toHaveBeenCalledWith(
        new RequestParams({ sharedIds: ['entity1', 'entity2'] })
      );
      expect(notificationActions.notify).toHaveBeenCalledWith('Deletion success', 'success');
    });
  });
});
