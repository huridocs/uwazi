import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import rison from 'rison';
import searchAPI from 'app/Search/SearchAPI';
import Immutable from 'immutable';
import libraryHelpers from '../libraryFilters';

import requestState from '../requestState';

describe('static requestState()', () => {
  const aggregations = { buckets: [] };
  const templates = [
    { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
    { name: 'Ruling', _id: 'abc2', properties: [] }
  ];

  const thesauris = [{ name: 'countries', _id: '1', values: [] }];
  const documents = { rows: [{ title: 'Something to publish' }, { title: 'My best recipes' }], totalRows: 2, aggregations };
  const globalResources = { templates: Immutable.fromJS(templates), thesauris: Immutable.fromJS(thesauris) };

  beforeEach(() => {
    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  it('should request the documents passing search object on the store', (done) => {
    const query = { q: rison.encode({ filters: { something: 1 }, types: [] }) };
    const expectedSearch = {
      sort: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).sort,
      order: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).order,
      filters: { something: 1 },
      types: []
    };

    requestState({}, query, globalResources)
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
    spyOn(libraryHelpers, 'URLQueryToState').and.returnValue({ properties: 'properties', search: 'search' });
    const q = { filters: {}, types: ['type1'], order: 'desc', sort: 'creationDate' };
    const query = { q: rison.encode(q) };
    requestState({}, query, globalResources)
    .then((state) => {
      expect(libraryHelpers.URLQueryToState).toHaveBeenCalledWith(q, templates, thesauris);
      expect(state.library.filters.documentTypes).toEqual(['type1']);
      expect(state.library.filters.properties).toBe('properties');
      expect(state.library.search).toBe('search');
      done();
    })
    .catch(done.fail);
  });

  describe('when is for geolocation', () => {
    it('should query with geolocation flag', (done) => {
      const query = { q: rison.encode({ filters: { something: 1 }, types: [] }) };
      const expectedSearch = {
        sort: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).sort,
        order: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).order,
        filters: { something: 1 },
        types: [],
        geolocation: true
      };

      requestState({}, query, globalResources, 'markers')
      .then((state) => {
        expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
        expect(state.library.markers).toEqual(documents);
        expect(state.library.aggregations).toEqual(aggregations);
        expect(state.library.filters.documentTypes).toEqual([]);
        done();
      });
    });
  });
});
