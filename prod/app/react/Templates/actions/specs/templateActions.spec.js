"use strict";var _reactReduxForm = require("react-redux-form");
var _immutable = _interopRequireDefault(require("immutable"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _RequestParams = require("../../../utils/RequestParams");

var _config = require("../../../config.js");
var _uniqueID = require("../../../../shared/uniqueID");
var actions = _interopRequireWildcard(require("../templateActions"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var notifications = _interopRequireWildcard(require("../../../Notifications/actions/notificationsActions"));
var notificationsTypes = _interopRequireWildcard(require("../../../Notifications/actions/actionTypes"));
var types = _interopRequireWildcard(require("../actionTypes"));
var _TemplatesAPI = _interopRequireDefault(require("../../TemplatesAPI"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('templateActions', () => {
  let dispatch;
  let getState;
  let formModel;
  beforeEach(() => {
    (0, _uniqueID.mockID)();
    formModel = {
      thesauris: _immutable.default.fromJS([{ _id: 'first_thesauri_id' }, { _id: 2 }]),
      template: {
        data: { properties: [{ name: 'property1' }, { name: 'property2' }] } } };


    dispatch = jasmine.createSpy('dispatch');
    getState = jasmine.createSpy('getState').and.returnValue(formModel);
    spyOn(_reactReduxForm.actions, 'change');
    spyOn(_reactReduxForm.actions, 'load');
    spyOn(_reactReduxForm.actions, 'move');
    spyOn(_reactReduxForm.actions, 'remove');
    spyOn(_reactReduxForm.actions, 'reset');
    spyOn(_reactReduxForm.actions, 'resetErrors');
  });

  describe('addProperty()', () => {
    it('should add the property to the form data with a unique id in the index provided', () => {
      actions.addProperty({ name: 'property3' }, 0)(dispatch, getState);
      expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('template.data.properties', [
      { name: 'property3', localID: 'unique_id' },
      { name: 'property1' },
      { name: 'property2' }]);

    });

    describe('when property is a select or multiselect', () => {
      it('should should add as first thesauri as default value', () => {
        actions.addProperty({ name: 'property3', type: 'select' }, 0)(dispatch, getState);
        expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('template.data.properties', [
        { name: 'property3', type: 'select', localID: 'unique_id', content: 'first_thesauri_id' },
        { name: 'property1' },
        { name: 'property2' }]);


        actions.addProperty({ name: 'property4', type: 'multiselect' }, 0)(dispatch, getState);
        expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('template.data.properties', [
        { name: 'property4', type: 'multiselect', localID: 'unique_id', content: 'first_thesauri_id' },
        { name: 'property1' },
        { name: 'property2' }]);

      });
    });
  });

  describe('setNestedProperties()', () => {
    it('should update the property in the index provided', () => {
      actions.setNestedProperties(0, ['123', '456'])(dispatch, getState);
      expect(_reactReduxForm.actions.load).toHaveBeenCalledWith('template.data.properties[0].nestedProperties', ['123', '456']);
    });
  });

  describe('updateProperty()', () => {
    it('should update the property in the index provided', () => {
      actions.updateProperty({ name: 'new name' }, 0)(dispatch, getState);
      expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('template.data.properties', [
      { name: 'new name' },
      { name: 'property2' }]);

    });
  });

  describe('selectProperty()', () => {
    it('should return an SELECT_PROPERTY type action with the property index', () => {
      const action = actions.selectProperty('property index');
      expect(action).toEqual({ type: types.SELECT_PROPERTY, index: 'property index' });
    });
  });

  describe('resetTemplate()', () => {
    it('should reset the form data', () => {
      actions.resetTemplate()(dispatch);
      expect(_reactReduxForm.actions.reset).toHaveBeenCalledWith('template.data');
    });
  });

  describe('removeProperty', () => {
    it('should remove the property from the data', () => {
      actions.removeProperty(1)(dispatch);
      expect(_reactReduxForm.actions.remove).toHaveBeenCalledWith('template.data.properties', 1);
      expect(_reactReduxForm.actions.resetErrors).toHaveBeenCalledWith('template.data');
    });
  });

  describe('reorderProperty', () => {
    it('should reorder the properties in the form data', () => {
      actions.reorderProperty(1, 2)(dispatch);
      expect(_reactReduxForm.actions.move).toHaveBeenCalledWith('template.data.properties', 1, 2);
    });
  });

  describe('async actions', () => {
    beforeEach(() => {
      spyOn(notifications, 'notify');
      _fetchMock.default.restore();
      _fetchMock.default.
      post(`${_config.APIURL}templates`, { body: JSON.stringify({ name: 'saved_template' }) });
    });

    afterEach(() => _fetchMock.default.restore());

    describe('saveTemplate', () => {
      it('should sanitize the properties before saving', () => {
        spyOn(_TemplatesAPI.default, 'save').and.returnValue(Promise.resolve({}));
        const originalTemplateData = { name: 'name',
          properties: [{ localID: '1', label: 'label', type: 'relationship', inherit: true, relationType: '1', content: '' }] };

        actions.saveTemplate(originalTemplateData)(() => {});
        expect(_TemplatesAPI.default.save).toHaveBeenCalledWith(new _RequestParams.RequestParams({
          name: 'name',
          properties: [{ content: '', inherit: false, label: 'label', localID: '1', relationType: '1', type: 'relationship' }] }));

      });

      it('should save the template and dispatch a TEMPLATE_SAVED action', done => {
        spyOn(_reactReduxForm.actions, 'merge').and.returnValue({ type: 'mergeAction' });
        const originalTemplateData = { name: 'my template',
          properties: [
          { localID: 'a1b2', label: 'my property' },
          { localID: 'a1b3', label: 'my property' }] };


        const expectedActions = [
        { type: types.SAVING_TEMPLATE },
        { type: types.TEMPLATE_SAVED, data: { name: 'saved_template' } },
        { type: 'templates/UPDATE', value: { name: 'saved_template' } },
        { type: 'mergeAction' },
        { type: notificationsTypes.NOTIFY, notification: { message: 'Saved successfully.', type: 'success', id: 'unique_id' } }];

        const store = mockStore({});

        store.dispatch(actions.saveTemplate(originalTemplateData)).
        then(() => {
          expect(store.getActions()).toEqual(expectedActions);

          expect(originalTemplateData.properties[0].localID).toBe('a1b2');
          expect(_reactReduxForm.actions.merge).toHaveBeenCalledWith('template.data', { name: 'saved_template' });
        }).
        then(done).
        catch(done.fail);
      });

      describe('on error', () => {
        it('should dispatch template_saved', done => {
          spyOn(_TemplatesAPI.default, 'save').and.callFake(() => Promise.reject(new Error()));
          spyOn(_reactReduxForm.actions, 'merge').and.returnValue({ type: 'mergeAction' });
          const originalTemplateData = { name: 'my template',
            properties: [
            { localID: 'a1b2', label: 'my property' },
            { localID: 'a1b3', label: 'my property' }] };


          const expectedActions = [
          { type: types.SAVING_TEMPLATE },
          { type: types.TEMPLATE_SAVED, data: originalTemplateData }];


          const store = mockStore({});

          store.dispatch(actions.saveTemplate(originalTemplateData)).
          then(() => {
            expect(store.getActions()).toEqual(expectedActions);
          }).
          then(done).
          catch(done.fail);
        });
      });
    });
  });
});