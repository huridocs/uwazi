"use strict";var _Notifications = require("../../../Notifications");
var _EntitiesAPI = _interopRequireDefault(require("../../EntitiesAPI"));
var _Relationships = require("../../../Relationships");
var _RequestParams = require("../../../utils/RequestParams");

var actions = _interopRequireWildcard(require("../actions"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Entities actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');

    spyOn(_EntitiesAPI.default, 'save').and.returnValue(Promise.resolve({ _id: 'newId', _rev: 'newRev', sharedId: 'sharedId' }));
    spyOn(_EntitiesAPI.default, 'delete').and.returnValue(Promise.resolve());
    spyOn(_EntitiesAPI.default, 'deleteMultiple').and.returnValue(Promise.resolve());
    spyOn(_Notifications.notificationActions, 'notify').and.returnValue('NOTIFIED');
  });

  describe('saveEntity', () => {
    it('should dispatch a saving entity and save the data', done => {
      spyOn(_Relationships.actions, 'reloadRelationships').and.returnValue({ type: 'reloadRelationships' });
      actions.saveEntity('data')(dispatch).
      then(() => {
        expect(_EntitiesAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams('data'));
        expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Entity saved', 'success');
        expect(dispatch).toHaveBeenCalledWith({ type: 'entityView/entity/SET', value: { _id: 'newId', _rev: 'newRev', sharedId: 'sharedId' } });
        expect(dispatch).toHaveBeenCalledWith({ type: 'rrf/reset', model: 'entityView.entityForm' });
        expect(dispatch).toHaveBeenCalledWith({ type: 'reloadRelationships' });
        expect(_Relationships.actions.reloadRelationships).toHaveBeenCalledWith('sharedId');
        done();
      });
    });
  });

  describe('deleteEntity', () => {
    it('should delete the entity and notify', done => {
      actions.deleteEntity({ sharedId: 'sharedId' })(dispatch).
      then(() => {
        expect(_EntitiesAPI.default.delete).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: 'sharedId' }));
        expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Entity deleted', 'success');
        done();
      }).
      catch(done.fail);
    });
  });

  describe('deleteEntities', () => {
    it('should delete the entities and notify', async () => {
      await actions.deleteEntities([{ sharedId: 'entity1' }, { sharedId: 'entity2' }])(dispatch);
      expect(_EntitiesAPI.default.deleteMultiple).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedIds: ['entity1', 'entity2'] }));
      expect(_Notifications.notificationActions.notify).toHaveBeenCalledWith('Deletion success', 'success');
    });
  });
});