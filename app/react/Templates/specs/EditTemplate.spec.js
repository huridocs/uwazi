import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {APIURL} from '~/config.js';
import EditTemplate from '~/Templates/EditTemplate';
import TemplateCreator from '~/Templates/components/TemplateCreator';
import RouteHandler from '~/controllers/App/RouteHandler';
import {mockID} from '~/utils/uniqueID';

describe('EditTemplate', () => {
  let template = {id: '1', properties: [{label: 'label1'}, {label: 'label2'}]};
  let thesauri = [{label: '1'}, {label: '2'}];
  let component;
  let instance;
  let setTemplate = jasmine.createSpy('setTemplate');
  let props;
  let context;

  beforeEach(() => {
    props = {setTemplate};
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<EditTemplate {...props} />, {context});
    instance = component.instance();
    mockID();

    backend.restore();
    backend
    .mock(APIURL + 'templates?_id=templateId', 'GET', {body: JSON.stringify({rows: [template]})})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauri})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request for the template passed, the thesauris and return an object to fit in the state', (done) => {
      EditTemplate.requestState({templateId: 'templateId'})
      .then((response) => {
        let templateResponse = response.template.data.toJS();
        let thesauriResponse = response.template.uiState.toJS().thesauri;
        expect(templateResponse.properties[0]).toEqual({label: 'label1', id: 'unique_id'});
        expect(thesauriResponse).toEqual(thesauri);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      instance.setReduxState({template: {data: 'template_data', uiState: Immutable.fromJS({thesauri: 'thesauri'})}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_TEMPLATE', template: 'template_data'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_THESAURI', thesauri: 'thesauri'});
    });
  });
});
