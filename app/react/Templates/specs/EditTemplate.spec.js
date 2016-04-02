import React from 'react';
import Immutable from 'immutable';
import backend from 'fetch-mock';
import {APIURL} from '~/config.js';

import {shallow} from 'enzyme';
import {EditTemplate} from '~/Templates/EditTemplate';
import RouteHandler from '~/controllers/App/RouteHandler';

describe('EditTemplate', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let component;
  let instance;
  let saveTemplate = jasmine.createSpy('saveTemplate');
  let setTemplate = jasmine.createSpy('setTemplate');
  let props;

  beforeEach(() => {
    spyOn(Math, 'random').and.returnValue({
      toString() {
        return {
          substr() {
            return 'unique_id';
          }
        };
      }
    });
  });

  beforeEach(() => {
    props = {setTemplate, saveTemplate, template: {name: '', properties: []}};
    RouteHandler.renderedFromServer = true;
    component = shallow(<EditTemplate {...props} />);
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates?_id=templateId', 'GET', {body: JSON.stringify({rows: [template]})});
  });

  describe('clicking save button', () => {
    it('should call saveTemplate action with the template in props', () => {
      component.find('.save-template').simulate('click');

      expect(saveTemplate).toHaveBeenCalledWith(props.template);
    });
  });

  describe('static requestState()', () => {
    it('should request request for the template passed and return an object to fit in the state', (done) => {
      EditTemplate.requestState({templateId: 'templateId'})
      .then((response) => {
        let templateResponse = response.template.data.toJS();
        expect(templateResponse.properties[0]).toEqual({label: 'label1', id: 'unique_id'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({template: {data: 'template_data'}});
      expect(instance.props.setTemplate).toHaveBeenCalledWith('template_data');
    });
  });
});
