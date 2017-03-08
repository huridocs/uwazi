import * as actions from '../actions';
import * as Notifications from 'app/Notifications';
import api from 'app/Entities/EntitiesAPI';
import refenrecesAPI from 'app/Viewer/referencesAPI';

describe('Entities actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'save').and.returnValue(Promise.resolve({_id: 'newId', _rev: 'newRev'}));
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(api, 'deleteMultiple').and.returnValue(Promise.resolve());
    spyOn(refenrecesAPI, 'delete').and.returnValue(Promise.resolve());
    spyOn(Notifications, 'notify').and.returnValue('NOTIFIED');
  });

  describe('saveEntity', () => {
    it('should dispatch a saving entity and save the data', (done) => {
      actions.saveEntity('data')(dispatch)
      .then(() => {
        expect(api.save).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Entity saved', 'success');
        expect(dispatch).toHaveBeenCalledWith({type: 'entityView/entity/SET', value: {_id: 'newId', _rev: 'newRev'}});
        expect(dispatch).toHaveBeenCalledWith({type: 'rrf/reset', model: 'entityView.entityForm'});
        done();
      });
    });
  });

  describe('deleteEntity', () => {
    it('should delete the entity and notify', (done) => {
      actions.deleteEntity('data')(dispatch)
      .then(() => {
        expect(api.delete).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Entity deleted', 'success');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteEntities', () => {
    it('should delete the entities and notify', (done) => {
      actions.deleteEntities(['entity1', 'entity2'])(dispatch)
      .then(() => {
        expect(api.deleteMultiple).toHaveBeenCalledWith(['entity1', 'entity2']);
        expect(Notifications.notify).toHaveBeenCalledWith('Deletion success', 'success');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('deleteReference', () => {
    it('should delete the reference and notify', (done) => {
      actions.deleteReference('data')(dispatch)
      .then(() => {
        expect(refenrecesAPI.delete).toHaveBeenCalledWith('data');
        expect(Notifications.notify).toHaveBeenCalledWith('Connection deleted', 'success');
        done();
      })
      .catch(done.fail);
    });
  });
});
