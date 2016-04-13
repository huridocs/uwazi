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
    .mock(APIURL + 'documents/search?searchTerm=', 'GET', {body: JSON.stringify(documents)});
  });

  it('should render the DocumentsList', () => {
    expect(component.find(DocumentsList).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the documents', (done) => {
      Library.requestState()
      .then((state) => {
        expect(state).toEqual({library: {documents}});
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    it('should call setDocuments with the documents', () => {
      instance.setReduxState({library: {documents}});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents: documents});
    });
  });
});
