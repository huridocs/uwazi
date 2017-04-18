import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';
import {actions as formActions} from 'react-redux-form';

import {APIURL} from 'app/config.js';
import EditTemplate from 'app/Templates/EditTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';
import {mockID} from 'shared/uniqueID';

describe('EditTemplate', () => {
  let templates = [
    {_id: 'abc1', properties: [{label: 'label1'}, {label: 'label2'}], commonProperties: [{label: 'existingProperty'}]},
    {_id: 'abc2', properties: [{label: 'label3'}, {label: 'label4'}]},
    {_id: 'abc3', properties: [{label: 'label3'}, {label: 'label4'}], commonProperties: []}
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
    .get(APIURL + 'templates', {body: JSON.stringify({rows: templates})})
    .get(APIURL + 'thesauris', {body: JSON.stringify({rows: thesauris})});
  });

  afterEach(() => backend.restore());

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request templates and thesauris, and return templates, thesauris and find the editing template', (done) => {
      EditTemplate.requestState({templateId: 'abc2'})
      .then((response) => {
        expect(response.template.data._id).toEqual('abc2');
        expect(response.thesauris).toEqual(thesauris);
        expect(response.templates.length).toBe(3);
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

    it('should append new commonProperties if none exist (lazy migration)', (done) => {
      EditTemplate.requestState({templateId: 'abc2'})
      .then((response) => {
        expect(response.template.data.commonProperties.length).toBe(2);
        expect(response.template.data.commonProperties[0].label).toBe('Title');
        done();
      })
      .catch(done.fail);
    });

    it('should append new commonProperties if empty', (done) => {
      EditTemplate.requestState({templateId: 'abc3'})
      .then((response) => {
        expect(response.template.data.commonProperties.length).toBe(2);
        expect(response.template.data.commonProperties[0].label).toBe('Title');
        done();
      })
      .catch(done.fail);
    });

    it('should keep existing commonProperties if they already have values', (done) => {
      EditTemplate.requestState({templateId: 'abc1'})
      .then((response) => {
        expect(response.template.data.commonProperties.length).toBe(1);
        expect(response.template.data.commonProperties[0].label).toBe('existingProperty');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setTemplates with templates passed', () => {
      spyOn(formActions, 'load').and.returnValue('TEMPLATE MODEL LOADED');
      instance.setReduxState({template: {data: 'template_data'}, thesauris: 'thesauris', templates: 'templates'});
      expect(formActions.load).toHaveBeenCalledWith('template.data', 'template_data');
      expect(context.store.dispatch).toHaveBeenCalledWith('TEMPLATE MODEL LOADED');

      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: 'thesauris'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'templates/SET', value: 'templates'});
    });
  });
});
