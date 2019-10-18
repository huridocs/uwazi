"use strict";var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _RequestParams = require("../../utils/RequestParams");
var _EntitiesAPI = _interopRequireDefault(require("../EntitiesAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EntitiesAPI', () => {
  const arrayResponse = [{ entities: 'array' }];
  const searchResponse = [{ entities: 'search' }];
  const filteredSearchResult = [{ entities: 'Alfred' }];
  const singleResponse = [{ entities: 'single' }];
  const paramedResponse = [{ entities: 'paramed' }];
  const page2Text = { data: 'page 2 text' };
  const page1Text = { data: 'page 1 text' };

  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}entities?param=1`, { body: JSON.stringify({ rows: arrayResponse }) }).
    get(`${_config.APIURL}entities/search`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}entities/get_raw_page?sharedId=sharedId&pageNumber=2`, { body: JSON.stringify(page2Text) }).
    get(`${_config.APIURL}entities/get_raw_page?sharedId=sharedId&pageNumber=1`, { body: JSON.stringify(page1Text) }).
    get(`${_config.APIURL}entities/uploads`, { body: JSON.stringify({ rows: 'uploads' }) }).
    get(`${_config.APIURL}entities/count_by_template?templateId=templateId`, { body: JSON.stringify(1) }).
    get(`${_config.APIURL}entities/match_title?searchTerm=term`, { body: JSON.stringify(searchResponse) }).
    get(`${_config.APIURL}entities/search?searchTerm=Batman&joker=true`, { body: JSON.stringify(filteredSearchResult) }).
    get(`${_config.APIURL}entities?_id=documentId`, { body: JSON.stringify({ rows: singleResponse }) }).
    get(`${_config.APIURL}entities?param1=1&_id=documentId`, { body: JSON.stringify({ rows: paramedResponse }) }).
    delete(`${_config.APIURL}entities?sharedId=id`, { body: JSON.stringify({ backednResponse: 'testdelete' }) }).
    post(`${_config.APIURL}entities/bulkdelete`, { body: JSON.stringify({ backednResponse: 'testdeleteMultiple' }) }).
    post(`${_config.APIURL}entities`, { body: JSON.stringify({ backednResponse: 'test' }) }).
    post(`${_config.APIURL}entities/multipleupdate`, { body: JSON.stringify({ backednResponse: 'test multiple' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('uploads', () => {
    it('should request uploads', async () => {
      const response = await _EntitiesAPI.default.uploads();
      expect(response).toEqual('uploads');
    });
  });

  describe('pageRawText', () => {
    it('should get page_raw_page and return the text', async () => {
      const request = new _RequestParams.RequestParams({ sharedId: 'sharedId', pageNumber: 2 });
      const text = await _EntitiesAPI.default.getRawPage(request);
      expect(text).toBe(page2Text.data);
    });

    it('should get page 1 by default', async () => {
      const request = new _RequestParams.RequestParams({ sharedId: 'sharedId' });
      const text = await _EntitiesAPI.default.getRawPage(request);
      expect(text).toBe(page1Text.data);
    });
  });

  describe('get()', () => {
    it('should request entities', async () => {
      const request = new _RequestParams.RequestParams({ param: '1' });
      const response = await _EntitiesAPI.default.get(request);
      expect(response).toEqual(arrayResponse);
    });

    describe('when passing an id', () => {
      it('should request for the thesauri', async () => {
        const request = new _RequestParams.RequestParams({ _id: 'documentId' });
        const response = await _EntitiesAPI.default.get(request);
        expect(response).toEqual(singleResponse);
      });
    });

    describe('when passing params', () => {
      it('should add the params to the url', async () => {
        const request = new _RequestParams.RequestParams({ param1: '1', _id: 'documentId' });
        const response = await _EntitiesAPI.default.get(request);
        expect(response).toEqual(paramedResponse);
      });
    });
  });

  describe('getSuggestions()', () => {
    it('should match_title ', async () => {
      const request = new _RequestParams.RequestParams({ searchTerm: 'term' });
      const response = await _EntitiesAPI.default.getSuggestions(request);
      expect(response).toEqual(searchResponse);
    });
  });

  describe('countByTemplate()', () => {
    it('should count_by_template', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'templateId' });
      const response = await _EntitiesAPI.default.countByTemplate(request);
      expect(response).toEqual(1);
    });
  });

  describe('search()', () => {
    it('should search entities', async () => {
      const response = await _EntitiesAPI.default.search();
      expect(response).toEqual(searchResponse);
    });

    describe('when passing filters', () => {
      it('should search for it', async () => {
        const request = new _RequestParams.RequestParams({ searchTerm: 'Batman', joker: true });
        const response = await _EntitiesAPI.default.search(request);
        expect(response).toEqual(filteredSearchResult);
      });
    });
  });

  describe('save()', () => {
    it('should post the document data to /entities', async () => {
      const entity = { name: 'document name' };
      const request = new _RequestParams.RequestParams(entity);
      const response = await _EntitiesAPI.default.save(request);
      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}entities`).body)).toEqual(entity);
      expect(response).toEqual({ backednResponse: 'test' });
    });
  });

  describe('multipleUpdate()', () => {
    it('should post the ids and metadata to /entities/multipleupdate', async () => {
      const values = { metadata: { text: 'document text' } };
      const ids = ['1', '2'];
      const request = new _RequestParams.RequestParams({ values, ids });
      const response = await _EntitiesAPI.default.multipleUpdate(request);

      expect(JSON.parse(_fetchMock.default.lastOptions(`${_config.APIURL}entities/multipleupdate`).body)).toEqual({ ids, values });
      expect(response).toEqual({ backednResponse: 'test multiple' });
    });
  });

  describe('delete()', () => {
    it('should delete the document', async () => {
      const data = { sharedId: 'id' };
      const request = new _RequestParams.RequestParams(data);
      const response = await _EntitiesAPI.default.delete(request);

      expect(response).toEqual({ backednResponse: 'testdelete' });
    });
  });

  describe('deleteMultiple()', () => {
    it('should delete all the entities', async () => {
      const documents = [{ sharedId: 'id1' }, { sharedId: 'id2' }];
      const response = await _EntitiesAPI.default.deleteMultiple(new _RequestParams.RequestParams(documents));

      expect(response).toEqual({ backednResponse: 'testdeleteMultiple' });
    });
  });
});