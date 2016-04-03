import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';
import backend from 'fetch-mock';

import {APIURL} from '~/config.js';
import NewTemplate from '~/Templates/NewTemplate';
import TemplateCreator from '~/Templates/components/TemplateCreator';
// import RouteHandler from '~/controllers/App/RouteHandler';

describe('NewTemplate', () => {
  let component;
  let instance;
  let context;
  let thesauri = [{label: '1'}, {label: '2'}];

  beforeEach(() => {
    // RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<NewTemplate />, {context});
    instance = component.instance();
    backend.restore();
    backend
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify({rows: thesauri})});
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(TemplateCreator).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris and return an object to fit in the state', (done) => {
      NewTemplate.requestState()
      .then((response) => {
        let thesauriResponse = response.template.uiState.toJS().thesauri;
        expect(thesauriResponse).toEqual(thesauri);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setThesauri with thesauri passed', () => {
      instance.setReduxState({template: {uiState: Immutable.fromJS({thesauri: 'thesauri'})}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'SET_THESAURI', thesauri: 'thesauri'});
    });
  });
});
