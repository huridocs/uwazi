import * as actions from '../actions';
import {actions as formActions} from 'react-redux-form';

describe('entityFormActions', () => {
  describe('loadEntity', () => {
    it('should load the entity with default metadata properties if not present', () => {
      spyOn(formActions, 'load').and.returnValue('formload');
      let dispatch = jasmine.createSpy('dispatch');
      let entity = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let templates = [{_id: 'templateId', properties: [{name: 'test'}, {name: 'newProp'}]}];


      actions.loadEntity('formNamespace', entity, templates)(dispatch);

      let expectedEntity = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2', newProp: ''}};
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedEntity);
    });

    it('should should set the first template if entity has no template', () => {
      spyOn(formActions, 'load').and.returnValue('formload');
      spyOn(formActions, 'setInitial').and.returnValue('forminitial');
      let dispatch = jasmine.createSpy('dispatch');
      let entity = {title: 'test'};
      let templates = [{_id: 'templateId', properties: [{name: 'test'}, {name: 'newProp'}]}];


      actions.loadEntity('formNamespace', entity, templates)(dispatch);

      let expectedEntity = {title: 'test', metadata: {test: '', newProp: ''}, template: 'templateId'};
      expect(dispatch).toHaveBeenCalledWith('formload');
      expect(dispatch).toHaveBeenCalledWith('forminitial');
      expect(formActions.load).toHaveBeenCalledWith('formNamespace', expectedEntity);
      expect(formActions.setInitial).toHaveBeenCalledWith('formNamespace');
    });
  });

  describe('changeTemplate', () => {
    it('should change the entity template and remove/add metadata properties', () => {
      spyOn(formActions, 'setInitial').and.returnValue('forminitial');
      spyOn(formActions, 'change').and.returnValue('formMerge');
      let dispatch = jasmine.createSpy('dispatch');
      let entity = {title: 'test', template: 'templateId', metadata: {test: 'test', test2: 'test2'}};
      let template = {_id: 'newTemplate', properties: [{name: 'test'}, {name: 'newProp'}]};


      actions.changeTemplate('formNamespace', entity, template)(dispatch);

      let expectedEntity = {title: 'test', template: 'newTemplate', metadata: {test: 'test', newProp: ''}};
      expect(dispatch).toHaveBeenCalledWith('formMerge');
      expect(formActions.setInitial).toHaveBeenCalledWith('formNamespace');
      expect(formActions.change).toHaveBeenCalledWith('formNamespace', expectedEntity);
    });
  });
});
