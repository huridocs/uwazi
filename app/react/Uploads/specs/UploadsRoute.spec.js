import React from 'react';
import {shallow} from 'enzyme';
import rison from 'rison';

import UploadsRoute from 'app/Uploads/UploadsRoute';
import DocumentsList from 'app/Library/components/DocumentsList';
// import LibraryCharts from 'app/Charts/components/LibraryCharts';
// import ListChartToggleButtons from 'app/Charts/components/ListChartToggleButtons';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes.js';
import {fromJS as Immutable} from 'immutable';


import searchAPI from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('UploadsRoute', () => {
  let documents = [{title: 'Something to publish'}, {title: 'My best recipes'}];
  let aggregations = [{1: '23'}, {2: '123'}];
  let component;
  let instance;
  let context;
  let props = {location: {query: {q: '(a:1)'}}};
  let templates = [
    {name: 'Decision', _id: 'abc1', properties: [{name: 'p', filter: true, type: 'text', prioritySorting: true}]},
    {name: 'Ruling', _id: 'abc2', properties: []}
  ];
  let globalResources = {templates: Immutable(templates), thesauris: Immutable([])};

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = {store: {dispatch: jasmine.createSpy('dispatch')}};
    component = shallow(<UploadsRoute {...props} templates={globalResources.templates}/>, {context});
    instance = component.instance();

    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  xit('should render the DocumentsList (by default)', () => {
    expect(component.find(DocumentsList).length).toBe(1);
    expect(component.find(DocumentsList).props().storeKey).toBe('uploads');
    // expect(component.find(ListChartToggleButtons).props().active).toBe('list');
  });

  // it('should render the LibraryCharts (if query type is chart)', () => {
  //   props.location.query.view = 'chart';
  //   component = shallow(<UploadsRoute {...props}/>, {context});

  //   expect(component.find(DocumentsList).length).toBe(0);
  //   expect(component.find(LibraryCharts).length).toBe(1);
  //   expect(component.find(LibraryCharts).props().storeKey).toBe('uploads');
  //   expect(component.find(ListChartToggleButtons).props().active).toBe('chart');
  // });

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', (done) => {
      const query = {q: rison.encode({filters: {something: 1}, types: ['types']})};
      let params;

      const expectedSearch = {
        sort: prioritySortingCriteria.get({templates: Immutable(templates)}).sort,
        order: prioritySortingCriteria.get({templates: Immutable(templates)}).order,
        filters: {something: 1},
        types: ['types'],
        unpublished: true
      };

      UploadsRoute.requestState(params, query, globalResources)
      .then((state) => {
        expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
        expect(state.uploads.documents).toEqual(documents);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('setReduxState()', () => {
    beforeEach(() => {
      instance.setReduxState({uploads: {documents, filters: {}, aggregations}});
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({type: actionTypes.SET_DOCUMENTS, documents, __reducerKey: 'uploads'});
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
