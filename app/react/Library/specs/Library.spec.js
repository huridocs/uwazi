import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {APIURL} from 'app/config';
import Library from 'app/Library/Library';
import DocumentsList from 'app/Library/components/DocumentsList';
import RouteHandler from 'app/App/RouteHandler';
import createStore from 'app/store';
import * as actionTypes from 'app/Library/actions/actionTypes';
import * as libraryActions from '../actions/libraryActions';

describe('Library', () => {
  let documents = {rows: [{title: 'Something to publish'}, {title: 'My best recipes'}], totalRows: 2};
  let templates = {rows: [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}]};
  let thesauris = {rows: [{name: 'countries', _id: '1', values: []}]};
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
    .mock(APIURL + 'documents/search?prop1=prop1&filters=%7B%7D&types=%5B%5D', 'GET', {body: JSON.stringify(documents)})
    .mock(APIURL + 'templates', 'GET', {body: JSON.stringify(templates)})
    .mock(APIURL + 'thesauris', 'GET', {body: JSON.stringify(thesauris)});
  });

  it('should render the DocumentsList', () => {
    expect(component.find(DocumentsList).length).toBe(1);
  });

  describe('on mount', () => {
    it('should enterLirabry()', () => {
      component.instance().componentDidMount();
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'ENTER_LIBRARY'});
    });
  });

  describe('static requestState()', () => {
    it('should request the documents passing search object on the store', (done) => {
      createStore({search: {prop1: 'prop1'}});

      Library.requestState()
      .then((state) => {
        expect(state.library.documents).toEqual(documents);
        expect(state.library.filters.templates).toEqual(templates.rows);
        expect(state.library.filters.documentTypes).toEqual({abc1: false, abc2: false});
        expect(state.library.filters.allDocumentTypes).toBe(false);
        expect(state.library.filters.thesauris).toEqual(thesauris.rows);
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

    describe('when there store is already populated with documents', () => {
      it('should return the store values', (done) => {
        createStore({search: {prop1: 'prop1'}, library: {documents: Immutable.fromJS(['doc1', 'doc2'])}});
        Library.requestState()
        .then((state) => {
          expect(state.library.documents).toEqual(['doc1', 'doc2']);
          expect(state.library.filters.templates).toEqual(templates.rows);
          expect(state.library.filters.documentTypes).toEqual({abc1: false, abc2: false});
          expect(state.library.filters.allDocumentTypes).toBe(false);
          expect(state.library.filters.thesauris).toEqual(thesauris.rows);
          done();
        })
        .catch(done.fail);
      });
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      spyOn(libraryActions, 'setTemplates');
      instance.setReduxState({library: {documents, filters: {templates: templates.rows, thesauris: thesauris.rows}}});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents});
    });

    it('should call setTemplates with the templates and thesauris', () => {
      expect(libraryActions.setTemplates)
      .toHaveBeenCalledWith(templates.rows, thesauris.rows);
    });
  });
});
