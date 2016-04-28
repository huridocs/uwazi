import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';
import backend from 'fetch-mock';

import {APIURL} from 'app/config.js';
import NewTemplate from 'app/Templates/NewTemplate';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
// import RouteHandler from 'app/controllers/App/RouteHandler';

describe('NewTemplate', () => {
  let component;
  let instance;
  let context;
  let thesauris = [{label: '1'}, {label: '2'}];
  let templates = [{name: 'Comic'}, {name: 'Newspaper'}];

  beforeEach(() => {
    // RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<NewTemplate />, {context});
    instance = component.instance();
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauris})})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify({rows: templates})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris and templates to fit in the state', (done) => {
      NewTemplate.requestState()
      .then((response) => {
        let state = response.template.uiState.toJS();
        expect(state.thesauris).toEqual(thesauris);
        expect(state.templates).toEqual(templates);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setThesauri with thesauri passed', () => {
      instance.setReduxState({template: {uiState: Immutable.fromJS({thesauris: 'thesauris'})}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_THESAURIS', thesauris: 'thesauris'});
    });
  });
});
