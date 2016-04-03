import React from 'react';
import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';
import {shallow} from 'enzyme';

import {APIURL} from '~/config.js';
import {Templates} from '~/Templates/Templates';

import backend from 'fetch-mock';

describe('Templates', () => {
  let templates = [{key: 'template1', id: '1', value: {}}, {key: 'template2', id: '2', value: {}}];
  let thesauris = [{name: 'thesauri1', values: []}, {name: 'thesauri2', values: []}];
  let component;
  let instance;
  let setTemplates = jasmine.createSpy('setTemplates');
  let deleteTemplate = jasmine.createSpy('deleteTemplate');
  let setThesauris = jasmine.createSpy('setThesauris');
  let props;

  beforeEach(() => {
    props = {setTemplates, deleteTemplate, templates, thesauris, setThesauris};
    component = shallow(<Templates {...props} />);
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})})
    .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({id: '2'})});
  });

  describe('static requestState()', () => {
    it('should request templates and return immutable version for the store', (done) => {
      Templates.requestState()
      .then((response) => {
        expect(response.templates).toEqualImmutable(Immutable.fromJS(templates));
        expect(response.thesauris).toEqualImmutable(Immutable.fromJS(thesauris));
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
      expect(deleteTemplate).toHaveBeenCalledWith(templates[1]);
    });
  });
});
