import * as actions from '../actions';
import * as reactReduxForm from 'react-redux-form';
import {actions as formActions} from 'react-redux-form';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {APIURL} from 'app/config.js';
import * as types from '../actionTypes';
import * as routeActions from 'app/Viewer/actions/routeActions';
import {mockID} from 'shared/uniqueID.js';
import {api} from 'app/Entities';

import Immutable from 'immutable';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Metadata Actions', () => {
  describe('loadInReduxForm', () => {
    it('should load the document with default metadata properties if not present', () => {
      spyOn(formActions, 'load').and.returnValue('formload');
      let dispatch = jasmine.createSpy('dispatch');
      let doc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let templates = [{_id: 'templateId', properties: [{name: 'test'}, {name: 'newProp'}]}];

      actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);
      let expectedDoc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2', newProp: ''}};
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
    });

    describe('When doc has no template', () => {
      let dispatch;
      let doc;
      let templates;

      beforeEach(() => {
        spyOn(formActions, 'load').and.returnValue('formload');
        spyOn(formActions, 'reset').and.returnValue('formreset');
        dispatch = jasmine.createSpy('dispatch');
        doc = {title: 'test'};
        templates = [{
          _id: 'templateId1',
          isEntity: true,
          properties: [
            {name: 'test'},
            {name: 'newProp'},
            {name: 'date', type: 'date'},
            {name: 'multi', type: 'multiselect'}
          ]
        }, {
          _id: 'templateId2',
          properties: [
            {name: 'test'},
            {name: 'newProp'},
            {name: 'date', type: 'date'},
            {name: 'multi', type: 'multiselect'}
          ]
        }];
      });

      it('should should set the first template', () => {
        actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        let expectedDoc = {title: 'test', metadata: {test: '', newProp: '', multi: []}, template: 'templateId1'};
        expect(dispatch).toHaveBeenCalledWith('formreset');
        expect(dispatch).toHaveBeenCalledWith('formload');
        expect(formActions.reset).toHaveBeenCalledWith('formNamespace');
        expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });

      it('should should set the first document template if document has type document', () => {
        doc = {title: 'test', type: 'document'};

        actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        let expectedDoc = {title: 'test', type: 'document', metadata: {test: '', newProp: '', multi: []}, template: 'templateId2'};
        expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });

      it('should should set the first entity template if document has type entity', () => {
        doc = {title: 'test', type: 'entity'};
        templates[0].isEntity = false;
        templates[1].isEntity = true;

        actions.loadInReduxForm('formNamespace', doc, templates)(dispatch);

        let expectedDoc = {title: 'test', type: 'entity', metadata: {test: '', newProp: '', multi: []}, template: 'templateId2'};
        expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      });
    });
  });

  describe('changeTemplate', () => {
    beforeEach(() => {
      const doc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      spyOn(reactReduxForm, 'getModel').and.returnValue(doc);
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should change the document template and reset metadata properties (preserving types)', () => {
      spyOn(formActions, 'reset').and.returnValue('formReset');
      spyOn(formActions, 'load').and.returnValue('formLoad');

      const dispatch = jasmine.createSpy('dispatch');

      const template = {_id: 'newTemplate', properties: [{name: 'test'}, {name: 'newProp', type: 'nested'}]};
      const state = {
        templates: Immutable.fromJS([
          template,
          {_id: 'anotherTemplate'}
        ])
      };

      const getState = () => state;

      actions.changeTemplate('formNamespace', 'newTemplate')(dispatch, getState);
      expect(reactReduxForm.getModel).toHaveBeenCalledWith(state, 'formNamespace');

      let expectedDoc = {title: 'test', template: 'newTemplate', metadata: {test: '', newProp: []}};
      expect(dispatch).toHaveBeenCalledWith('formReset');
      expect(formActions.reset).toHaveBeenCalledWith('formNamespace');

      jasmine.clock().tick(0);

      expect(dispatch).toHaveBeenCalledWith('formLoad');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
    });
  });

  describe('loadTemplate', () => {
    it('should load the given template with empty values', () => {
      spyOn(formActions, 'load').and.returnValue('formLoad');

      let template = {_id: '1', properties: [
        {name: 'year', type: 'numeric'},
        {name: 'powers', content: '1', type: 'multiselect'},
        {name: 'enemies', content: '2', type: 'multiselect'},
        {name: 'color', type: 'text', required: true}
      ]};

      let expectedModel = {
        template: '1',
        metadata: {
          year: '',
          powers: [],
          enemies: [],
          color: ''
        }
      };

      let dispatch = jasmine.createSpy('dispatch');
      actions.loadTemplate('formNamespace', template)(dispatch);
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedModel);
    });
  });

  describe('multipleUpdate', () => {
    it('should update selected entities with the given metadata and template', (done) => {
      mockID();
      spyOn(api, 'multipleUpdate').and.returnValue(Promise.resolve('response'));
      let entities = Immutable.fromJS([{sharedId: '1'}, {sharedId: '2'}]);
      const metadata = {text: 'something new'};
      const template = 'template';

      const store = mockStore({});
      store.dispatch(actions.multipleUpdate(entities, {template, metadata}))
      .then((docs) => {
        expect(api.multipleUpdate).toHaveBeenCalledWith(['1', '2'], {template, metadata});
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
      mockUpload = superagent.post(APIURL + 'reupload');
      spyOn(mockUpload, 'field').and.callThrough();
      spyOn(mockUpload, 'attach').and.callThrough();
      spyOn(superagent, 'post').and.returnValue(mockUpload);

      // needed to work with firefox/chrome and phantomjs
      file = {name: 'filename'};
      let isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //

      store = mockStore({locale: 'es'});
      store.dispatch(actions.reuploadDocument('abc1', file, 'sharedId'));
    });

    it('should upload the file while dispatching the upload progress', () => {
      const expectedActions = [
        {type: types.START_REUPLOAD_DOCUMENT, doc: 'abc1'},
        {type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 55},
        {type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 65},
        {type: types.REUPLOAD_COMPLETE, doc: 'abc1'}
      ];


      expect(mockUpload.field).toHaveBeenCalledWith('document', 'abc1');
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

      mockUpload.emit('progress', {percent: 55.1});
      mockUpload.emit('progress', {percent: 65});
      mockUpload.emit('response');
      expect(store.getActions()).toEqual(expectedActions);
    });

    describe('upon response', () => {
      let state = {};

      beforeEach(() => {
        spyOn(routeActions, 'requestViewerState').and.returnValue({then: (cb) => cb(state)});
        spyOn(routeActions, 'setViewerState').and.returnValue({type: 'setViewerState'});
        mockUpload.emit('response');
      });

      it('should request and set viewer states', () => {
        expect(routeActions.requestViewerState).toHaveBeenCalledWith('sharedId', 'es');
        expect(routeActions.setViewerState).toHaveBeenCalledWith(state);
        expect(store.getActions()).toContain({type: 'setViewerState'});
      });
    });
  });
});
