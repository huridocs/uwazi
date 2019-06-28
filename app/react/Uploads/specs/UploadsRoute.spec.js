import React from 'react';
import { shallow } from 'enzyme';
import rison from 'rison';

import UploadsRoute from 'app/Uploads/UploadsRoute';
import RouteHandler from 'app/App/RouteHandler';
import * as actionTypes from 'app/Library/actions/actionTypes.js';
import { fromJS as Immutable } from 'immutable';


import searchAPI from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('UploadsRoute', () => {
  const documents = [{ title: 'Something to publish' }, { title: 'My best recipes' }];
  const aggregations = [{ 1: '23' }, { 2: '123' }];
  let component;
  let instance;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  const templates = [
    { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
    { name: 'Ruling', _id: 'abc2', properties: [] }
  ];
  const globalResources = { templates: Immutable(templates), thesauris: Immutable([]), relationTypes: Immutable([]) };

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<UploadsRoute {...props} templates={globalResources.templates}/>, { context });
    instance = component.instance();

    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', (done) => {
      const query = { q: rison.encode({ filters: { something: 1 }, types: ['types'] }) };
      let params;

      const expectedSearch = {
        sort: prioritySortingCriteria.get({ templates: Immutable(templates) }).sort,
        order: prioritySortingCriteria.get({ templates: Immutable(templates) }).order,
        filters: { something: 1 },
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
      instance.setReduxState({ uploads: { documents, filters: {}, aggregations } });
    });

    it('should call setDocuments with the documents', () => {
      expect(context.store.dispatch).toHaveBeenCalledWith({ type: actionTypes.SET_DOCUMENTS, documents, __reducerKey: 'uploads' });
    });
  });

  describe('componentWillReceiveProps()', () => {
    beforeEach(() => {
      instance.superComponentWillReceiveProps = jasmine.createSpy('superComponentWillReceiveProps');
    });

    it('should update if "q" has changed', () => {
      const nextProps = { location: { query: { q: '(a:2)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).toHaveBeenCalledWith(nextProps);
    });

    it('should not update if "q" is the same', () => {
      const nextProps = { location: { query: { q: '(a:1)' } } };
      instance.componentWillReceiveProps(nextProps);
      expect(instance.superComponentWillReceiveProps).not.toHaveBeenCalled();
    });
  });
});
