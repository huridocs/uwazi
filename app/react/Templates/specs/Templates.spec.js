import React from 'react';
import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';
import {shallow} from 'enzyme';

import {APIURL} from '~/config.js';
import {Templates} from '~/Templates/Templates';
import RouteHandler from '~/controllers/App/RouteHandler';

import backend from 'fetch-mock';

describe('Templates', () => {
  let templates = [{key: 'template1', id: '1', value: {}}, {key: 'template2', id: '2', value: {}}];
  let component;
  let instance;
  let setTemplates = jasmine.createSpy('setTemplates');
  let deleteTemplate = jasmine.createSpy('deleteTemplate');
  let props;

  beforeEach(() => {
    props = {setTemplates, deleteTemplate, templates};
    RouteHandler.renderedFromServer = false;
    component = shallow(<Templates {...props} />);
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({id: '2'})});
  });

  describe('static requestState()', () => {
    it('should request templates and find template based on the key passed', (done) => {
      let id = '1';
      Templates.requestState({templateId: id})
      .then((response) => {
        expect(response.templates).toEqualImmutable(Immutable.fromJS(templates));
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({templates});
      expect(instance.props.setTemplates).toHaveBeenCalledWith(templates);
    });
  });

  describe('deleteTemplate', () => {
    it('should call props.deleteTemplate with id of the template', () => {
      component.find('.template-remove').last().simulate('click');
      expect(deleteTemplate).toHaveBeenCalledWith(templates[1]);
    });
  });
});
