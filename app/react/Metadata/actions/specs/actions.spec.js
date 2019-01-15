import * as reactReduxForm from 'react-redux-form';
import Immutable from 'immutable';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { APIURL } from 'app/config.js';
import * as routeActions from 'app/Viewer/actions/routeActions';
import { mockID } from 'shared/uniqueID.js';
import { api } from 'app/Entities';

import * as types from '../actionTypes';
import * as actions from '../actions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Metadata Actions', () => {
  describe('loadInReduxForm', () => {
    it('should load the document with default metadata properties if not present', () => {
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formload');
      const dispatch = jasmine.createSpy('dispatch');
      const doc = { title: 'test', template: 'templateId', metadata: { test: 'test', test2: 'test2' } };
      const templates = [{ _id: 'templateId', properties: [{ name: 'test' }, { name: 'newProp' }, { name: 'testRelation', type: 'relationship' }] }];

      actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);
      const expectedDoc = { title: 'test', template: 'templateId', metadata: { test: 'test', newProp: '', testRelation: [] } };
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
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
            { name: 'geolocation', type: 'geolocation' }
          ]
        }, {
          _id: 'templateId2',
          name: 'last',
          properties: [
            { name: 'test' },
            { name: 'newProp' },
            { name: 'date', type: 'date' },
            { name: 'multi', type: 'multiselect' }
          ]
        }];
      });

      it('should set the first template', () => {
        actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        const expectedDoc = {
          title: 'test',
          metadata: { test: '', newProp: '', multi: [] },
          template: 'templateId1'
        };
        expect(dispatch).toHaveBeenCalledWith('formreset');
        expect(dispatch).toHaveBeenCalledWith('formload');
        expect(reactReduxForm.actions.reset).toHaveBeenCalledWith('formNamespace');
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });

      it('should set the first document template', () => {
        doc = { title: 'test', type: 'document' };

        actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        const expectedDoc = { title: 'test', type: 'document', metadata: { test: '', newProp: '', multi: [] }, template: 'templateId1' };
        expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });
  });

  describe('changeTemplate', () => {
    beforeEach(() => {
      const doc = { title: 'test', template: 'templateId', metadata: { test: 'test', test2: 'test2' } };
      spyOn(reactReduxForm, 'getModel').and.returnValue(doc);
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should change the document template preserve matching values', () => {
      spyOn(reactReduxForm.actions, 'reset').and.returnValue('formReset');
      spyOn(reactReduxForm.actions, 'load').and.returnValue('formLoad');

      const dispatch = jasmine.createSpy('dispatch');

      const template = { _id: 'newTemplate', properties: [{ name: 'test' }, { name: 'newProp', type: 'nested' }] };
      const state = {
        templates: Immutable.fromJS([
          template,
          { _id: 'templateId', properties: [{ name: 'test' }, { name: 'test2' }] }
        ])
      };

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
          { name: 'color', type: 'text', required: true }
        ]
      };

      const expectedModel = {
        template: '1',
        metadata: {
          year: '',
          powers: [],
          enemies: [],
          color: ''
        }
      };

      const dispatch = jasmine.createSpy('dispatch');
      actions.loadTemplate('formNamespace', template)(dispatch);
      expect(reactReduxForm.actions.load).toHaveBeenCalledWith('formNamespace', expectedModel);
    });
  });

  describe('multipleUpdate', () => {
    it('should update selected entities with the given metadata and template', (done) => {
      mockID();
      spyOn(api, 'multipleUpdate').and.returnValue(Promise.resolve('response'));
      const entities = Immutable.fromJS([{ sharedId: '1' }, { sharedId: '2' }]);
      const metadata = { text: 'something new' };
      const template = 'template';

      const store = mockStore({});
      store.dispatch(actions.multipleUpdate(entities, { template, metadata }))
      .then((docs) => {
        expect(api.multipleUpdate).toHaveBeenCalledWith(['1', '2'], { template, metadata });
        expect(docs[0].metadata).toEqual(metadata);
        expect(docs[0].template).toEqual('template');
        expect(docs[1].metadata).toEqual(metadata);
        expect(docs[1].template).toEqual('template');
      })
      .then(done)
      .catch(done.fail);
    });
  });

  describe('reuploadDocument', () => {
    let mockUpload;
    let store;
    let file;

    beforeEach(() => {
      mockUpload = superagent.post(`${APIURL}reupload`);
      spyOn(mockUpload, 'field').and.returnValue(mockUpload);
      spyOn(mockUpload, 'attach').and.returnValue(mockUpload);
      spyOn(superagent, 'post').and.returnValue(mockUpload);

      // needed to work with firefox/chrome and phantomjs
      file = { name: 'filename' };
      const isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //

      jest.spyOn(routeActions, 'requestViewerState').mockImplementation(() => Promise.resolve({ documentViewer: { doc: 'doc' } }));
      jest.spyOn(routeActions, 'setViewerState').mockImplementation(() => ({ type: 'setViewerState' }));
      store = mockStore({ locale: 'es', templates: 'immutableTemplates' });
      store.dispatch(actions.reuploadDocument('abc1', file, 'sharedId', 'storeKey'));
    });

    it('should upload the file while dispatching the upload progress (including the storeKey to update the results)', () => {
      const expectedActions = [
        { type: types.START_REUPLOAD_DOCUMENT, doc: 'abc1' },
        { type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 55 },
        { type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 65 },
        { type: types.REUPLOAD_COMPLETE, doc: 'abc1', file: { filename: 'filename', size: 34, originalname: 'name' }, __reducerKey: 'storeKey' }
      ];

      expect(mockUpload.field).toHaveBeenCalledWith('document', 'sharedId');
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, 'filename');

      mockUpload.emit('progress', { percent: 55.1 });
      mockUpload.emit('progress', { percent: 65 });
      mockUpload.emit('response', { body: { filename: 'filename', size: 34, originalname: 'name' } });
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
