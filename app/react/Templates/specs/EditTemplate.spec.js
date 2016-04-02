import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from '~/config.js';
import EditTemplate from '~/Templates/EditTemplate';
import TemplateCreator from '~/Templates/components/TemplateCreator';
import RouteHandler from '~/controllers/App/RouteHandler';

describe('EditTemplate', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let component;
  let instance;
  let setTemplate = jasmine.createSpy('setTemplate');
  let props;
  let context;

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
    props = {setTemplate};
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditTemplate {...props} />, {context});
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'templates?_id=templateId', 'GET', {body: JSON.stringify({rows: [template]})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
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
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_TEMPLATE', template: 'template_data'});
    });
  });
});
