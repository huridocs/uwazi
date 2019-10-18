"use strict";var reactReduxForm = _interopRequireWildcard(require("react-redux-form"));
var _immutable = _interopRequireDefault(require("immutable"));
var _superagent = _interopRequireDefault(require("superagent"));
var _reduxMockStore = _interopRequireDefault(require("redux-mock-store"));
var _reduxThunk = _interopRequireDefault(require("redux-thunk"));
var _config = require("../../../config.js");
var routeActions = _interopRequireWildcard(require("../../../Viewer/actions/routeActions"));
var _uniqueID = require("../../../../shared/uniqueID.js");
var _Entities = require("../../../Entities");
var _RequestParams = require("../../../utils/RequestParams");

var types = _interopRequireWildcard(require("../actionTypes"));
var actions = _interopRequireWildcard(require("../actions"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const middlewares = [_reduxThunk.default];
const mockStore = (0, _reduxMockStore.default)(middlewares);

describe('Metadata Actions', () => {
  describe('loadInReduxForm', () => {
    beforeEach(() => {
      spyOn(_Entities.api, 'get');
    });

    it('should request the document and load with default metadata properties if not present', async () => {
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
      const dispatch = jasmine.createSpy('dispatch');
      const doc = { sharedId: '1', title: 'updated title', template: 'templateId', metadata: { test: 'test', test2: 'test2' } };
      _Entities.api.get.and.returnValue(Promise.resolve([doc]));
      const templates = [{ _id: 'templateId', properties: [{ name: 'test' }, { name: 'newProp' }, { name: 'testRelation', type: 'relationship' }] }];

      await actions.loadInReduxForm('formNamespace', { sharedId: '1', title: 'old title' }, templates)(dispatch);
      const expectedDoc = {
        sharedId: '1',
        title: 'updated title',
        template: 'templateId',
        metadata: { test: 'test', newProp: '', testRelation: [] } };

      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      expect(_Entities.api.get).toHaveBeenCalledWith(new _RequestParams.RequestParams({ sharedId: '1' }));
    });

    describe('When doc has no template', () => {
      let dispatch;
      let doc;
      let templates;

      beforeEach(() => {
        spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
        spyOn(reactReduxForm.actions, 'reset').and.returnValue('formreset');
        dispatch = jasmine.createSpy('dispatch');
        doc = { title: 'test' };
        templates = [{
          _id: 'templateId1',
          name: 'first',
          default: true,
          properties: [
          { name: 'test' },
          { name: 'newProp' },
          { name: 'date', type: 'date' },
          { name: 'multi', type: 'multiselect' },
          { name: 'geolocation', type: 'geolocation' }] },

        {
          _id: 'templateId2',
          name: 'last',
          properties: [
          { name: 'test' },
          { name: 'newProp' },
          { name: 'date', type: 'date' },
          { name: 'multi', type: 'multiselect' }] }];


      });

      it('should set the first template', async () => {
        await actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        const expectedDoc = {
          title: 'test',
          metadata: { test: '', newProp: '', multi: [] },
          template: 'templateId1' };

        expect(dispatch).toHaveBeenCalledWith('formreset');
        expect(dispatch).toHaveBeenCalledWith('formload');
        expect(reactReduxForm.actions.reset).toHaveBeenCalledWith('formNamespace');
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });
  });

  describe('changeTemplate', () => {
    let dispatch;
    let state;

    beforeEach(() => {
      const doc = { title: 'test', template: 'templateId', metadata: { test: 'test', test2: 'test2' } };
      spyOn(reactReduxForm, 'getModel').and.returnValue(doc);
      jasmine.clock().install();

      spyOn(reactReduxForm.actions, 'reset').and.returnValue('formReset');
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formLoad');

      dispatch = jasmine.createSpy('dispatch');

      const template = { _id: 'newTemplate', properties: [{ name: 'test' }, { name: 'newProp', type: 'nested' }] };
      state = {
        templates: _immutable.default.fromJS([
        template,
        { _id: 'templateId', properties: [{ name: 'test' }, { name: 'test2' }] }]) };


    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should change the document template preserve matching values', () => {
      const getState = () => state;

      actions.changeTemplate('formNamespace', 'newTemplate')(dispatch, getState);
      expect(reactReduxForm.getModel).toHaveBeenCalledWith(state, 'formNamespace');

      const expectedDoc = { title: 'test', template: 'newTemplate', metadata: { test: 'test', newProp: [] } };
      expect(dispatch).toHaveBeenCalledWith('formReset');
      expect(reactReduxForm.actions.reset).toHaveBeenCalledWith('formNamespace');

      jasmine.clock().tick(0);

      expect(dispatch).toHaveBeenCalledWith('formLoad');
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
    });
  });

  describe('loadTemplate', () => {
    it('should load the given template with empty values', () => {
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formLoad');

      const template = {
        _id: '1',
        properties: [
        { name: 'year', type: 'numeric' },
        { name: 'powers', content: '1', type: 'multiselect' },
        { name: 'enemies', content: '2', type: 'multiselect' },
        { name: 'color', type: 'text', required: true }] };



      const expectedModel = {
        template: '1',
        metadata: {
          year: '',
          powers: [],
          enemies: [],
          color: '' } };



      const dispatch = jasmine.createSpy('dispatch');
      actions.loadTemplate('formNamespace', template)(dispatch);
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedModel);
    });
  });

  describe('multipleUpdate', () => {
    it('should update selected entities with the given metadata and template', done => {
      (0, _uniqueID.mockID)();
      spyOn(_Entities.api, 'multipleUpdate').and.returnValue(Promise.resolve('response'));
      const entities = _immutable.default.fromJS([{ sharedId: '1' }, { sharedId: '2' }]);
      const metadata = { text: 'something new' };
      const template = 'template';

      const store = mockStore({});
      store.dispatch(actions.multipleUpdate(entities, { template, metadata })).
      then(docs => {
        expect(_Entities.api.multipleUpdate).toHaveBeenCalledWith(
        new _RequestParams.RequestParams({ ids: ['1', '2'], values: { template, metadata } }));

        expect(docs[0].metadata).toEqual(metadata);
        expect(docs[0].template).toEqual('template');
        expect(docs[1].metadata).toEqual(metadata);
        expect(docs[1].template).toEqual('template');
      }).
      then(done).
      catch(done.fail);
    });
  });

  describe('reuploadDocument', () => {
    let mockUpload;
    let store;
    let file;
    let doc;

    beforeEach(() => {
      mockUpload = _superagent.default.post(`${_config.APIURL}reupload`);
      spyOn(mockUpload, 'field').and.returnValue(mockUpload);
      spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
      spyOn(mockUpload, 'set').and.returnValue(mockUpload);
      spyOn(_superagent.default, 'post').and.returnValue(mockUpload);

      // needed to work with firefox/chrome and phantomjs
      const isChrome = typeof File === 'function';
      file = isChrome ? new File([], 'filename') : { name: 'filename' };
      // ------------------------------------------------

      jest.spyOn(routeActions, 'requestViewerState').mockImplementation(() => Promise.resolve({ documentViewer: { doc: 'doc' } }));
      jest.spyOn(routeActions, 'setViewerState').mockImplementation(() => ({ type: 'setViewerState' }));
      store = mockStore({ locale: 'es', templates: 'immutableTemplates' });
    });

    it('should upload the file while dispatching the upload progress (including the language and storeKey to update the results)', () => {
      _Entities.api.get = () => Promise.resolve([doc]);
      store.dispatch(actions.reuploadDocument('abc1', file, 'sharedId', 'storeKey'));
      const expectedActions = [
      { type: types.START_REUPLOAD_DOCUMENT, doc: 'abc1' },
      { type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 55 },
      { type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 65 },
      { type: types.REUPLOAD_COMPLETE, doc: 'abc1', file: { filename: 'filename', size: 34, originalname: 'name' }, __reducerKey: 'storeKey' }];


      expect(mockUpload.set).toHaveBeenCalledWith('Content-Language', 'es');
      expect(mockUpload.field).toHaveBeenCalledWith('document', 'sharedId');
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, 'filename');

      mockUpload.emit('progress', { percent: 55.1 });
      mockUpload.emit('progress', { percent: 65 });
      mockUpload.emit('response', { body: { filename: 'filename', size: 34, originalname: 'name' } });
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});