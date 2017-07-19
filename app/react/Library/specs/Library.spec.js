import React from 'react';
import {shallow} from 'enzyme';
import rison from 'rison';

import searchAPI from 'app/Search/SearchAPI';
import libraryHelpers from '../helpers/libraryFilters';
import Library from 'app/Library/Library';
import DocumentsList from 'app/Library/components/DocumentsList';
import LibraryCharts from 'app/Charts/components/LibraryCharts';
import ListChartToggleButtons from 'app/Charts/components/ListChartToggleButtons';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes';
import * as libraryActions from '../actions/libraryActions';
import createStore from 'app/store';
import {fromJS as Immutable} from 'immutable';

import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('Library', () => {
  let aggregations = {buckets: []};
  let documents = {rows: [{title: 'Something to publish'}, {title: 'My best recipes'}], totalRows: 2, aggregations};
  let templates = [
    {name: 'Decision', _id: 'abc1', properties: [{name: 'p', filter: true, type: 'text', prioritySorting: true}]},
    {name: 'Ruling', _id: 'abc2', properties: []}
  ];
  let thesauris = [{name: 'countries', _id: '1', values: []}];
  let globalResources = {templates: Immutable(templates), thesauris: Immutable(thesauris)};
  createStore({templates, thesauris});
  let component;
  let instance;
  let context;
  let props = {location: {query: {q: '(a:1)'}}};

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<Library {...props}/>, {context});
    instance = component.instance();

    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  it('should render the DocumentsList (by default)', () => {
    expect(component.find(DocumentsList).length).toBe(1);
    expect(component.find(DocumentsList).props().storeKey).toBe('library');
    expect(component.find(ListChartToggleButtons).props().active).toBe('list');
  });

  it('should render the LibraryCharts (if query type is chart)', () => {
    props.location.query.view = 'chart';
    component = shallow(<Library {...props}/>, {context});

    expect(component.find(DocumentsList).length).toBe(0);
    expect(component.find(LibraryCharts).length).toBe(1);
    expect(component.find(LibraryCharts).props().storeKey).toBe('library');
    expect(component.find(ListChartToggleButtons).props().active).toBe('chart');
  });

  describe('static requestState()', () => {
    it('should request the documents passing search object on the store', (done) => {
      const query = {q: rison.encode({filters: {something: 1}, types: []})};
      const expectedSearch = {
        sort: prioritySortingCriteria.get({templates: Immutable(templates)}).sort,
        order: prioritySortingCriteria.get({templates: Immutable(templates)}).order,
        filters: {something: 1},
        types: []
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
      const q = {filters: {}, types: ['type1'], order: 'desc', sort: 'creationDate'};
      const query = {q: rison.encode(q)};
      Library.requestState({}, query, globalResources)
      .then((state) => {
        expect(libraryHelpers.URLQueryToState).toHaveBeenCalledWith(q, templates, thesauris);
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

  describe('componentWillReceiveProps()', () => {
    beforeEach(() => {
      instance.superComponentWillReceiveProps = jasmine.createSpy('superComponentWillReceiveProps');
    });

    it('should update if "q" has changed', () => {
      const nextProps = {location: {query: {q: '(a:2)'}}};
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).toHaveBeenCalledWith(nextProps);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = {location: {query: {q: '(a:1)'}}};
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).not.toHaveBeenCalled();
    });
  });
});
