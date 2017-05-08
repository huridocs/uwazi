import React from 'react';
import {shallow} from 'enzyme';

import searchAPI from 'app/Search/SearchAPI';
import libraryHelpers from '../helpers/libraryFilters';
import Library from 'app/Library/Library';
import DocumentsList from 'app/Library/components/DocumentsList';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes';
import * as libraryActions from '../actions/libraryActions';
import createStore from 'app/store';
import {fromJS as Immutable} from 'immutable';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('Library', () => {
  let aggregations = {buckets: []};
  let documents = {rows: [{title: 'Something to publish'}, {title: 'My best recipes'}], totalRows: 2, aggregations};
  let templates = [{name: 'Decision', _id: 'abc1', properties: []}, {name: 'Ruling', _id: 'abc2', properties: []}];
  let thesauris = [{name: 'countries', _id: '1', values: []}];
  let globalResources = {templates: Immutable(templates), thesauris: Immutable(thesauris)};
  createStore({templates, thesauris});
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
  });

  it('should render the DocumentsList', () => {
    expect(component.find(DocumentsList).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the documents passing search object on the store', (done) => {
      const query = {filters: {}, types: []};
      const expectedSearch = {
        sort: prioritySortingCriteria.get().sort,
        order: prioritySortingCriteria.get().order,
        filters: query.filters,
        types: query.types
      };

      Library.requestState({}, query, globalResources)
      .then((state) => {
        expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
        expect(state.library.documents).toEqual(documents);
        expect(state.library.aggregations).toEqual(aggregations);
        expect(state.library.filters.documentTypes).toEqual([]);
        done();
      })
      .catch(done.fail);
    });

    it('should process the query url params and transform it to state', (done) => {
      spyOn(libraryHelpers, 'URLQueryToState').and.returnValue({properties: 'properties', search: 'search'});
      const query = {filters: {}, types: ['type1']};
      Library.requestState({}, query, globalResources)
      .then((state) => {
        expect(libraryHelpers.URLQueryToState).toHaveBeenCalledWith(query, templates, thesauris);
        expect(state.library.filters.documentTypes).toEqual(['type1']);
        expect(state.library.filters.properties).toBe('properties');
        expect(state.library.search).toBe('search');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      spyOn(libraryActions, 'setTemplates');
      instance.setReduxState({library: {documents, aggregations, filters: {documentTypes: 'types', properties: 'properties'}}});
    });

    it('should call set the documents and aggregations', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents, __reducerKey: 'library'});
      expect(context.store.dispatch).toHaveBeenCalledWith({type: 'aggregations/SET', value: aggregations, __reducerKey: 'library'});
    });
  });
});
