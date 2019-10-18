"use strict";var _prioritySortingCriteria = _interopRequireDefault(require("../../../utils/prioritySortingCriteria"));
var _rison = _interopRequireDefault(require("rison"));
var _SearchAPI = _interopRequireDefault(require("../../../Search/SearchAPI"));
var _immutable = _interopRequireDefault(require("immutable"));
var _libraryFilters = _interopRequireDefault(require("../libraryFilters"));

var _requestState = _interopRequireDefault(require("../requestState"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('static requestState()', () => {
  const aggregations = { buckets: [] };
  const templates = [
  { name: 'Decision', _id: 'abc1', properties: [{ name: 'p', filter: true, type: 'text', prioritySorting: true }] },
  { name: 'Ruling', _id: 'abc2', properties: [] }];

  const relationTypes = [
  { name: 'Victim', _id: 'abc3', properties: [{ name: 'p', filter: true, type: 'text' }] }];


  const thesauris = [{ name: 'countries', _id: '1', values: [] }];
  const documents = { rows: [{ title: 'Something to publish' }, { title: 'My best recipes' }], totalRows: 2, aggregations };
  const globalResources = {
    templates: _immutable.default.fromJS(templates),
    thesauris: _immutable.default.fromJS(thesauris),
    relationTypes: _immutable.default.fromJS(relationTypes) };


  beforeEach(() => {
    spyOn(_SearchAPI.default, 'search').and.returnValue(Promise.resolve(documents));
  });

  it('should request the documents passing search object on the store', async () => {
    const data = { q: _rison.default.encode({ filters: { something: 1 }, types: [] }) };
    const request = { data, headers: 'headers' };

    const expectedSearch = {
      data: {
        sort: _prioritySortingCriteria.default.get({ templates: _immutable.default.fromJS(templates) }).sort,
        order: _prioritySortingCriteria.default.get({ templates: _immutable.default.fromJS(templates) }).order,
        filters: { something: 1 },
        types: [] },

      headers: 'headers' };


    const actions = await (0, _requestState.default)(request, globalResources);

    expect(_SearchAPI.default.search).toHaveBeenCalledWith(expectedSearch);
    expect(actions).toMatchSnapshot();
  });

  it('should process the query url params and transform it to state', async () => {
    spyOn(_libraryFilters.default, 'URLQueryToState').and.returnValue({ properties: 'properties', search: 'search' });
    const q = { filters: {}, types: ['type1'], order: 'desc', sort: 'creationDate' };
    const query = { q: _rison.default.encode(q) };
    const request = { data: query };
    await (0, _requestState.default)(request, globalResources);

    expect(_libraryFilters.default.URLQueryToState).toHaveBeenCalledWith(q, templates, thesauris, relationTypes);
  });

  describe('when is for geolocation', () => {
    it('should query with geolocation flag', async () => {
      const query = { q: _rison.default.encode({ filters: { something: 1 }, types: [] }) };
      const expectedSearch = {
        data: {
          sort: _prioritySortingCriteria.default.get({ templates: _immutable.default.fromJS(templates) }).sort,
          order: _prioritySortingCriteria.default.get({ templates: _immutable.default.fromJS(templates) }).order,
          filters: { something: 1 },
          types: [],
          geolocation: true } };



      const request = { data: query };
      const actions = await (0, _requestState.default)(request, globalResources, 'markers');

      expect(_SearchAPI.default.search).toHaveBeenCalledWith(expectedSearch);
      expect(actions).toMatchSnapshot();
    });
  });
});