import searchAPI from 'app/Search/SearchAPI';
import prioritySortingCriteria from 'app/utils/prioritySortingCriteria';
import { RequestParams } from 'app/utils/RequestParams';
import Immutable from 'immutable';
import rison from 'rison-node';
import { requestState, processQuery } from '../requestState';

describe('static requestState()', () => {
  let globalResources;
  let templates;
  beforeEach(() => {
    const aggregations = { buckets: [] };
    templates = [
      {
        name: 'Decision',
        _id: 'abc1',
        properties: [
          { name: 'p', filter: true, type: 'text', prioritySorting: true },
          { name: 'country', filter: false, type: 'select', content: 'countries' },
          { name: 'location', filter: false, type: 'geolocation' },
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

    globalResources = {
      templates: Immutable.fromJS(templates),
      settings: { collection: Immutable.fromJS({ features: {} }) },
      thesauris: Immutable.fromJS(thesauris),
      relationTypes: Immutable.fromJS(relationTypes),
      user: Immutable.fromJS({}),
    };

    spyOn(searchAPI, 'search').and.callFake(async () => Promise.resolve(documents));
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
      const actions = await requestState(request, globalResources, { geolocation: true });

      expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);

      expect(actions).toMatchSnapshot();
    });

    it('should work when there are no geolocation type properties', async () => {
      templates = [
        {
          name: 'Appeal',
          _id: 'abc2',
          properties: [
            { name: 'p', filter: true, type: 'text', prioritySorting: true },
            { name: 'description', filter: false, type: 'markdown' },
          ],
        },
      ];
      globalResources.templates = Immutable.fromJS(templates);
      const query = { q: rison.encode({ filters: { something: 1 }, types: [] }) };
      const expectedSearch = {
        data: {
          sort: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).sort,
          order: prioritySortingCriteria.get({ templates: Immutable.fromJS(templates) }).order,
          filters: { something: 1 },
          types: [],
          view: undefined,
        },
        headers: {},
      };
      const request = new RequestParams(query);

      await requestState(request, globalResources);

      expect(searchAPI.search).toHaveBeenCalledWith(expectedSearch);
    });
  });

  describe('processQuery()', () => {
    it('should process the query params into a query object', () => {
      const params = { q: '(from:5,limit:30,order:desc,sort:creationDate)' };
      globalResources.library = {
        documents: Immutable.fromJS({
          rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        }),
      };
      const query = processQuery(params, globalResources, 'library');
      expect(query).toEqual({
        from: 5,
        limit: 30,
        order: 'desc',
        sort: 'creationDate',
        view: undefined,
      });
    });

    it('should reset the from param when there are no documents', () => {
      const params = { q: '(from:5,limit:30,order:desc,sort:creationDate)' };
      globalResources.library = {
        documents: Immutable.fromJS({
          rows: [],
        }),
      };
      const query = processQuery(params, globalResources, 'library');
      expect(query).toEqual({
        from: 0,
        limit: 35,
        order: 'desc',
        sort: 'creationDate',
        view: undefined,
      });
    });

    it('should return permission aggregations if logged in', () => {
      const params = { q: '(order:desc,sort:creationDate)' };
      globalResources.user = Immutable.fromJS({ role: 'admin' });
      let query = processQuery(params, globalResources, 'library');
      expect(query).toEqual({
        order: 'desc',
        sort: 'creationDate',
        view: undefined,
        aggregatePermissionsByUsers: true,
        aggregatePublishingStatus: true,
      });

      globalResources.user = Immutable.fromJS({ role: 'collaborator' });
      query = processQuery(params, globalResources, 'library');
      expect(query).toEqual({
        order: 'desc',
        sort: 'creationDate',
        view: undefined,
        aggregatePermissionsByLevel: true,
        aggregatePublishingStatus: true,
      });
    });

    it('should not return permission if user is not logged in', () => {
      const params = { q: '(order:desc,sort:creationDate)' };
      globalResources.user = Immutable.fromJS({});
      const query = processQuery(params, globalResources, 'library');
      expect(query).toEqual({
        order: 'desc',
        sort: 'creationDate',
        view: undefined,
      });
    });
  });
});
