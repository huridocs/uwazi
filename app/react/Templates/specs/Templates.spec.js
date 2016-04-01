import React from 'react';
import backend from 'fetch-mock';
import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';
import {shallow} from 'enzyme';

import {APIURL} from '~/config.js';
import {Templates} from '~/Templates/Templates';
import RouteHandler from '~/controllers/App/RouteHandler';

describe('Templates', () => {
  let templatesResponse = [{key: 'template1', id: '1', value: {}}, {key: 'template2', id: '2', value: {}}];
  let component;
  let instance;
  let setTemplates = jasmine.createSpy('setTemplates');
  let props;

  beforeEach(() => {
    props = {setTemplates, templates: []};
    RouteHandler.renderedFromServer = false;
    component = shallow(<Templates {...props} />);
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templatesResponse})})
    .mock(APIURL + 'templates', 'POST', {body: JSON.stringify({id: '2'})});
  });

  describe('static requestState()', () => {
    it('should request templates and find template based on the key passed', (done) => {
      let id = '1';
      Templates.requestState({templateId: id})
      .then((response) => {
        expect(response.templates).toEqualImmutable(Immutable.fromJS(templatesResponse));
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      let templates = 'templates';
      instance.setReduxState({templates});
      expect(instance.props.setTemplates).toHaveBeenCalledWith(templates);
    });
  });
});
