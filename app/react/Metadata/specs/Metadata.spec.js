import React from 'react';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import {Metadata} from 'app/Metadata/Metadata';

import backend from 'fetch-mock';

describe('Metadata', () => {
  let templates = [{_id: 'templateId1'}, {_id: 'templateId2'}];
  let thesauris = [{name: 'thesauri1', values: []}, {name: 'thesauri2', values: []}];
  let component;
  let instance;
  let setTemplates = jasmine.createSpy('setTemplates');
  let checkTemplateCanBeDeleted = jasmine.createSpy('checkTemplateCanBeDeleted');
  let deleteThesauri = jasmine.createSpy('deleteThesauri');
  let setThesauris = jasmine.createSpy('setThesauris');
  let props;

  beforeEach(() => {
    props = {setTemplates, checkTemplateCanBeDeleted, templates, thesauris, setThesauris, deleteThesauri};
    component = shallow(<Metadata {...props} />);
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})})
    .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({id: '2'})});
  });

  describe('static requestState()', () => {
    it('should request templates and return immutable version for the store', (done) => {
      Metadata.requestState()
      .then((response) => {
        expect(response.templates).toEqual(templates);
        expect(response.thesauris).toEqual(thesauris);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({templates, thesauris});
      expect(instance.props.setTemplates).toHaveBeenCalledWith(templates);
      expect(instance.props.setThesauris).toHaveBeenCalledWith(thesauris);
    });
  });

  describe('deleteTemplate', () => {
    it('should call props.deleteTemplate with id of the template', () => {
      component.find('.template-remove').last().simulate('click');
      expect(checkTemplateCanBeDeleted).toHaveBeenCalledWith(templates[1]);
    });
  });

  describe('deleteThesauri', () => {
    it('should call props.deleteThesauri with id of the template', () => {
      component.find('.thesauri-remove').last().simulate('click');
      expect(deleteThesauri).toHaveBeenCalledWith(thesauris[1]);
    });
  });
});
