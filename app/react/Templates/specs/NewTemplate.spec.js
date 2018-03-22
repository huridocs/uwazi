import React from 'react';
import {actions as formActions} from 'react-redux-form';
import {shallow} from 'enzyme';

import NewTemplate from 'app/Templates/NewTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';

describe('NewTemplate', () => {
  let component;
  let instance;
  let context;
  let thesauris = [{label: '1'}, {label: '2'}];
  let templates = [{name: 'Comic'}, {name: 'Newspaper'}];
  let relationTypes = [{name: 'Friend'}, {name: 'Family'}];

  beforeEach(() => {
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    spyOn(templatesAPI, 'get').and.returnValue(templates);
    spyOn(thesaurisAPI, 'get').and.returnValue(thesauris);
    spyOn(relationTypesAPI, 'get').and.returnValue(relationTypes);
    component = shallow(<NewTemplate />, {context});
    instance = component.instance();
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris and templates to fit in the state', (done) => {
      NewTemplate.requestState()
      .then((response) => {
        expect(response.thesauris).toEqual(thesauris);
        expect(response.templates).toEqual(templates);
        expect(response.relationTypes).toEqual(relationTypes);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setThesauri with thesauri passed', () => {
      spyOn(formActions, 'reset').and.returnValue('reset');
      instance.setReduxState({thesauris: 'thesauris', templates: 'templates', relationTypes: 'relationTypes'});
      expect(context.store.dispatch).toHaveBeenCalledWith('reset');
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: 'thesauris'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'templates/SET', value: 'templates'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'relationTypes/SET', value: 'relationTypes'});
    });
  });
});
