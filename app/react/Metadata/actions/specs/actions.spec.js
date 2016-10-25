import * as actions from '../actions';
import {actions as formActions} from 'react-redux-form';
import superagent from 'superagent';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {APIURL} from 'app/config.js';
import * as types from '../actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('documentFormActions', () => {
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
        spyOn(formActions, 'setInitial').and.returnValue('forminitial');
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
        expect(dispatch).toHaveBeenCalledWith('formload');
        expect(dispatch).toHaveBeenCalledWith('forminitial');
        expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
        expect(formActions.setInitial).toHaveBeenCalledWith('formNamespace');
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
    it('should change the document template and reset metadata properties (preserving types)', () => {
      spyOn(formActions, 'reset').and.returnValue('formReset');
      spyOn(formActions, 'load').and.returnValue('formLoad');
      let dispatch = jasmine.createSpy('dispatch');

      let doc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let template = {_id: 'newTemplate', properties: [{name: 'test'}, {name: 'newProp', type: 'nested'}]};

      jasmine.clock().install();

      actions.changeTemplate('formNamespace', doc, template)(dispatch);

      let expectedDoc = {title: 'test', template: 'newTemplate', metadata: {test: '', newProp: []}};
      expect(dispatch).toHaveBeenCalledWith('formReset');
      expect(formActions.reset).toHaveBeenCalledWith('formNamespace');

      jasmine.clock().tick(0);

      expect(dispatch).toHaveBeenCalledWith('formLoad');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      jasmine.clock().uninstall();
    });
  });

  describe('reuploadDocument', () => {
    it('should upload the file while dispatching the upload progress', () => {
      let mockUpload = superagent.post(APIURL + 'reupload');
      spyOn(mockUpload, 'field').and.callThrough();
      spyOn(mockUpload, 'attach').and.callThrough();
      spyOn(superagent, 'post').and.returnValue(mockUpload);

      const expectedActions = [
        {type: types.START_REUPLOAD_DOCUMENT, doc: 'abc1'},
        {type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 55},
        {type: types.REUPLOAD_PROGRESS, doc: 'abc1', progress: 65},
        {type: types.REUPLOAD_COMPLETE, doc: 'abc1'}
      ];
      const store = mockStore({});

      // needed to work with firefox/chrome and phantomjs
      let file = {name: 'filename'};
      let isChrome = typeof File === 'function';
      if (isChrome) {
        file = new File([], 'filename');
      }
      //

      store.dispatch(actions.reuploadDocument('abc1', file));
      expect(mockUpload.field).toHaveBeenCalledWith('document', 'abc1');
      expect(mockUpload.attach).toHaveBeenCalledWith('file', file, file.name);

      mockUpload.emit('progress', {percent: 55.1});
      mockUpload.emit('progress', {percent: 65});
      mockUpload.emit('response');
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
