"use strict";var _config = require("../../../config.js");
var _activitylogActions = require("../activitylogActions");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('activitylog actions', () => {
  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}activitylog?limit=2&url=entities`, {
      body: JSON.stringify({ url: '/api/entities', rows: [{ some: 'results' }] }) });

  });

  const checkDispatch = async (action, method) => {
    const dispatch = jasmine.createSpy('dispatch');
    await action({ limit: 2, url: 'entities' })(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: 'activitylog/search/SET', value: { url: '/api/entities', rows: [{ some: 'results' }] } });
    expect(dispatch).toHaveBeenCalledWith({ type: `activitylog/list/${method}`, value: [{ some: 'results' }] });
  };

  describe('activitylogSearch', () => {
    it('should search for entries with the given query and store results', async () => {
      checkDispatch(_activitylogActions.activitylogSearch, 'SET');
    });
  });

  describe('activitylogSearchMore', () => {
    it('should search for entries with the given query and append results', async () => {
      checkDispatch(_activitylogActions.activitylogSearchMore, 'CONCAT');
    });
  });
});