import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import EditTemplate from 'app/Templates/EditTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';
import {mockID} from 'shared/uniqueID';

describe('EditTemplate', () => {
  let templates = [
    {_id: 'abc1', properties: [{label: 'label1'}, {label: 'label2'}]},
    {_id: 'abc2', properties: [{label: 'label3'}, {label: 'label4'}]}
  ];
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
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request templates and thesauris, and return templates, thesauris and find the editing template', (done) => {
      EditTemplate.requestState({templateId: 'abc2'})
      .then((response) => {
        expect(response.template.data._id).toEqual('abc2');
        expect(response.template.uiState.thesauris).toEqual(thesauris);
        expect(response.template.uiState.templates.length).toBe(2);
        done();
      })
      .catch(done.fail);
    });

    it('should prepare the template properties with unique ids', (done) => {
      EditTemplate.requestState({templateId: 'abc2'})
      .then((response) => {
        expect(response.template.data.properties[0]).toEqual({label: 'label3', localID: 'unique_id'});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({template: {data: 'template_data', uiState: {thesauris: 'thesauris', templates: 'templates'}}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_TEMPLATE', template: 'template_data'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_THESAURIS', thesauris: 'thesauris'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_TEMPLATES', templates: 'templates'});
    });
  });
});
