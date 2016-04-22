import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config.js';
import Library from 'app/Library/Library';
import DocumentsList from 'app/Library/components/DocumentsList';
import RouteHandler from 'app/controllers/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes';

describe('Library', () => {
  let documents = [{title: 'Something to publish'}, {title: 'My best recipes'}];
  let templates = {rows: [{name: 'Decision'}, {name: 'Ruling'}]};
  let component;
  let instance;
  let context;
  let props = {};

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<Library {...props}/>, {context});
    instance = component.instance();

    backend.restore();
    backend
    .mock(APIURL + 'documents/search?searchTerm=', 'GET', {body: JSON.stringify(documents)})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify(templates)});
  });

  it('should render the DocumentsList', () => {
    expect(component.find(DocumentsList).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the documents', (done) => {
      Library.requestState()
      .then((state) => {
        expect(state.library.documents).toEqual(documents);
        done();
      })
      .catch(done.fail);
    });

    it('should request the templates', (done) => {
      Library.requestState()
      .then((state) => {
        expect(state.library.filters.templates).toEqual(templates.rows);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      instance.setReduxState({library: {documents, filters: {templates}}});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents});
    });

    it('should call setTemplates with the templates', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_TEMPLATES, templates});
    });
  });
});
