import searchAPI from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { RequestParams } from 'app/utils/RequestParams';
import Immutable from 'immutable';
import rison from 'rison';
import libraryHelpers from '../libraryFilters';
import requestState from '../requestState';

describe('static requestState()', () => {
  const aggregations = { buckets: [] };
  const templates = [
    {
      name: 'Decision',
      _id: 'abc1',
      properties: [
        { name: 'p', filter: true, type: 'text', prioritySorting: true },
        { name: 'country', filter: false, type: 'select', content: 'countries' },
      ],
    },
    { name: 'Ruling', _id: 'abc2', properties: [] },
  ];
  const relationTypes = [
    { name: 'Victim', _id: 'abc3', properties: [{ name: 'p', filter: true, type: 'text' }] },
  ];

  const thesauris = [{ name: 'countries', _id: '1', values: [] }];
  const documents = {
    rows: [{ title: 'Something to publish' }, { title: 'My best recipes' }],
    totalRows: 2,
    aggregations,
  };
  const globalResources = {
    templates: Immutable.fromJS(templates),
    thesauris: Immutable.fromJS(thesauris),
    relationTypes: Immutable.fromJS(relationTypes),
  };

  beforeEach(() => {
    spyOn(searchAPI, 'search').and.returnValue(Promise.resolve(documents));
  });

  it('should request the documents passing search object on the store', async () => {
    const data = { q: rison.encode({ filters: { something: 1 }, types: [] }), view: 'charts' };
    const request = new RequestParams(data, 'headers');

    const expectedSearch = {
      data: {
        sort: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).sort,
        order: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).order,
        filters: { something: 1 },
        types: [],
        view: 'charts',
        geolocation: false,
      },
      headers: 'headers',
    };

    const actions = await requestState(request, globalResources);

    expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
    expect(actions).toMatchSnapshot();
  });

  describe('when is for geolocation', () => {
    it('should query with geolocation flag', async () => {
      const query = { q: rison.encode({ filters: { something: 1 }, types: [] }) };
      const expectedSearch = {
        data: {
          sort: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).sort,
          order: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).order,
          filters: { something: 1 },
          types: [],
          geolocation: true,
          view: undefined,
        },
        headers: {},
      };

      const request = new RequestParams(query);
      const actions = await requestState(request, globalResources, 'markers');

      expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
      expect(actions).toMatchSnapshot();
    });
  });
});
