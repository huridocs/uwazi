import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import EditTemplate from 'app/Templates/EditTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/controllers/App/RouteHandler';
import {mockID} from 'app/utils/uniqueID';

describe('EditTemplate', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let thesauris = [{label: '1'}, {label: '2'}];
  let component;
  let instance;
  let props;
  let context;

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditTemplate {...props} />, {context});
    instance = component.instance();
    mockID();

    backend.restore();
    backend
    .mock(APIURL + 'templates?_id=templateId', 'GET', {body: JSON.stringify({rows: [template]})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request for the template passed, the thesauris and return an object to fit in the state', (done) => {
      EditTemplate.requestState({templateId: 'templateId'})
      .then((response) => {
        let templateResponse = response.template.data;
        let thesauriResponse = response.template.uiState.thesauris;
        expect(templateResponse.properties[0]).toEqual({label: 'label1', localID: 'unique_id'});
        expect(thesauriResponse).toEqual(thesauris);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({template: {data: 'template_data', uiState: {thesauris: 'thesauris'}}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_TEMPLATE', template: 'template_data'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_THESAURIS', thesauris: 'thesauris'});
    });
  });
});
