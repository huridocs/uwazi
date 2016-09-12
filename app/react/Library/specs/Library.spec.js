import React from 'react';
import backend from 'fetch-mock';
import {shallow} from 'enzyme';

import {APIURL} from 'app/config';
import searchAPI from 'app/Search/SearchAPI';
import libraryHelpers from '../helpers/libraryFilters';
import Library from 'app/Library/Library';
import DocumentsList from 'app/Library/components/DocumentsList';
import RouteHandler from 'app/App/RouteHandler';
//import createStore from 'app/store';
import * as actionTypes from 'app/Library/actions/actionTypes';
import * as libraryActions from '../actions/libraryActions';

describe('Library', () => {
  let aggregations = {buckets: []};
  let documents = {rows: [{title: 'Something to publish'}, {title: 'My best recipes'}], totalRows: 2, aggregations};
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

    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
    backend.restore();
    backend
    //.mock(APIURL + 'search?prop1=prop1&aggregations=%5B%5D&filters=%7B%7D&types=%5B%5D', 'GET', {body: JSON.stringify(documents)})
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
      const query = {filters: {}, types: []};
      Library.requestState({}, query)
      .then((state) => {
        expect(searchAPI.search).toHaveBeenCalledWith(query);
        expect(state.library.documents).toEqual(documents);
        expect(state.library.aggregations).toEqual(aggregations);
        expect(state.templates).toEqual(templates.rows);
        expect(state.library.filters.documentTypes).toEqual([]);
        expect(state.thesauris).toEqual(thesauris.rows);
        done();
      })
      .catch(done.fail);
    });

    it('should process the query url params and transform it to state', (done) => {
      spyOn(libraryHelpers, 'URLQueryToState').and.returnValue({properties: 'properties', search: 'search'});
      const query = {filters: {}, types: ['type1']};
      Library.requestState({}, query)
      .then((state) => {
        expect(libraryHelpers.URLQueryToState).toHaveBeenCalledWith(query, templates.rows, thesauris.rows);
        expect(state.library.filters.documentTypes).toEqual(['type1']);
        expect(state.library.filters.properties).toBe('properties');
        expect(state.search).toBe('search');
        done();
      })
      .catch(done.fail);
    });

    it('should request the templates', (done) => {
      Library.requestState()
      .then((state) => {
        expect(state.templates).toEqual(templates.rows);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      spyOn(libraryActions, 'setTemplates');
      instance.setReduxState({library:
                             {documents, aggregations, filters: {documentTypes: 'types', properties: 'properties'}},
                             templates: templates.rows,
                             thesauris: thesauris.rows
      });
    });

    it('should call set the documents and aggregations', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'library/aggregations/SET', value: aggregations});
    });

    it('should set templates and thesauris', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'templates/SET', value: templates.rows});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'thesauris/SET', value: thesauris.rows});
    });
  });
});
