import React from 'react';
import { shallow } from 'enzyme';
import rison from 'rison';

import UploadsRoute from 'app/Uploads/UploadsRoute';
import RouteHandler from 'app/App/RouteHandler';
import { fromJS as Immutable } from 'immutable';
import { RequestParams } from 'app/utils/RequestParams';

import searchAPI from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';

describe('UploadsRoute', () => {
  const documents = [{ title: 'Something to publish' }, { title: 'My best recipes' }];
  let component;
  let instance;
  let context;
  const props = { location: { query: { q: '(a:1)' } } };
  const templates = [
    {
      name: 'Decision',
      _id: 'abc1',
      properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }],
    },
    { name: 'Ruling', _id: 'abc2', properties: [] },
  ];
  const globalResources = {
    templates: Immutable(templates),
    thesauris: Immutable([]),
    relationTypes: Immutable([]),
  };

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = shallow(<UploadsRoute {...props} templates={globalResources.templates} />, {
      context,
    });
    instance = component.instance();

    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  describe('static requestState()', () => {
    it('should request unpublished documents, templates and thesauris', async () => {
      const query = { q: rison.encode({ filters: { something: 1 }, types: ['types'] }) };
      const expectedSearch = {
        sort: prioritySortingCriteria.get({ templates: Immutable(templates) }).sort,
        order: prioritySortingCriteria.get({ templates: Immutable(templates) }).order,
        filters: { something: 1 },
        types: ['types'],
        unpublished: true,
      };

      const requestParams = new RequestParams(query);

      await UploadsRoute.requestState(requestParams, globalResources);
      expect(searchAPI.search).toHaveBeenCalledWith(new RequestParams(expectedSearch));
      // expect(state.uploads.documents).toEqual(documents);
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
