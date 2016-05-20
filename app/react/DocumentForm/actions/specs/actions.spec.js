import * as actions from 'app/DocumentForm/actions/actions';
import {actions as formActions} from 'react-redux-form';

describe('documentFormActions', () => {
  describe('loadDocument', () => {
    it('should load the document with default metadata properties if not present', () => {
      spyOn(formActions, 'load').and.returnValue('formload');
      let dispatch = jasmine.createSpy('dispatch');
      let doc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let templates = [{_id: 'templateId', properties: [{name: 'test'}, {name: 'newProp'}]}];


      actions.loadDocument('formNamespace', doc, templates)(dispatch);

      let expectedDoc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2', newProp: ''}};
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
    });

    it('should should set the first template if document has no template', () => {
      spyOn(formActions, 'load').and.returnValue('formload');
      spyOn(formActions, 'setInitial').and.returnValue('forminitial');
      let dispatch = jasmine.createSpy('dispatch');
      let doc = {title: 'test'};
      let templates = [{_id: 'templateId', properties: [{name: 'test'}, {name: 'newProp'}]}];


      actions.loadDocument('formNamespace', doc, templates)(dispatch);

      let expectedDoc = {title: 'test', metadata: {test: '', newProp: ''}, template: 'templateId'};
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(dispatch).toHaveBeenCalledWith('forminitial');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedDoc);
      expect(formActions.setInitial).toHaveBeenCalledWith('formNamespace');
    });
  });

  describe('changeTemplate', () => {
    it('should change the document template and remove/add metadata properties', () => {
      spyOn(formActions, 'merge').and.returnValue('formMerge');
      spyOn(formActions, 'setInitial').and.returnValue('forminitial');
      let dispatch = jasmine.createSpy('dispatch');
      let doc = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let template = {_id: 'newTemplate', properties: [{name: 'test'}, {name: 'newProp'}]};


      actions.changeTemplate('formNamespace', doc, template)(dispatch);

      let expectedDoc = {title: 'test', template: 'newTemplate', metadata: {test: 'test', newProp: ''}};
      expect(dispatch).toHaveBeenCalledWith('formMerge');
      expect(formActions.merge).toHaveBeenCalledWith('formNamespace', expectedDoc);
      expect(formActions.setInitial).toHaveBeenCalledWith('formNamespace');
    });
  });
});
