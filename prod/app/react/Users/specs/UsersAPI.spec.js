"use strict";var _UsersAPI = _interopRequireDefault(require("../UsersAPI"));
var _api = _interopRequireDefault(require("../../utils/api"));
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('UsersAPI', () => {
  beforeEach(() => {
    _fetchMock.default.restore();
    _fetchMock.default.
    post(`${_config.APIURL}users`, { body: JSON.stringify('ok') }).
    post(`${_config.APIURL}users/new`, { body: JSON.stringify('ok new') }).
    get(`${_config.APIURL}user`, { body: JSON.stringify({ name: 'doe' }) });
  });

  afterEach(() => _fetchMock.default.restore());

  describe('save()', () => {
    let user;

    beforeEach(() => {
      user = {
        name: 'doe',
        _id: '123' };

    });

    it('should post to users', async () => {
      const request = { data: user };
      const response = await _UsersAPI.default.save(request);
      expect(response).toEqual('ok');
    });
  });

  describe('new()', () => {
    let user;

    beforeEach(() => {
      user = {
        name: 'doe',
        _id: '123' };

    });

    it('should post to users/new', async () => {
      const request = { data: user };
      const response = await _UsersAPI.default.new(request);
      expect(response).toEqual('ok new');
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', async () => {
      const response = await _UsersAPI.default.currentUser();
      expect(response).toEqual({ name: 'doe' });
    });
  });

  describe('get()', () => {
    it('should get all the users', async () => {
      spyOn(_api.default, 'get').and.returnValue(Promise.resolve({ json: ['users'] }));
      const request = {};
      const response = await _UsersAPI.default.get(request);
      expect(_api.default.get).toHaveBeenCalledWith('users', request);
      expect(response).toEqual(['users']);
    });
  });

  describe('delete()', () => {
    it('should delete the user', async () => {
      const user = { _id: '1234' };
      spyOn(_api.default, 'delete').and.returnValue(Promise.resolve({ json: 'ok' }));
      const response = await _UsersAPI.default.delete(user);
      expect(_api.default.delete).toHaveBeenCalledWith('users', user);
      expect(response).toEqual('ok');
    });
  });
});