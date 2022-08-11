import users from 'app/Users/UsersAPI';
import api from 'app/utils/api';
import { APIURL } from 'app/config.js';
import backend from 'fetch-mock';

describe('UsersAPI', () => {
  beforeEach(() => {
    backend.restore();
    backend
      .post(`${APIURL}users`, { body: JSON.stringify('ok') })
      .post(`${APIURL}users/new`, { body: JSON.stringify('ok new') })
      .get(`${APIURL}user`, { body: JSON.stringify({ name: 'doe' }) });
  });

  afterEach(() => backend.restore());

  describe('save()', () => {
    let user;

    beforeEach(() => {
      user = {
        name: 'doe',
        _id: '123',
      };
    });

    it('should post to users', async () => {
      const request = { data: user };
      const response = await users.save(request);
      expect(response).toEqual('ok');
    });
  });

  describe('new()', () => {
    let user;

    beforeEach(() => {
      user = {
        name: 'doe',
        _id: '123',
      };
    });

    it('should post to users/new', async () => {
      const request = { data: user };
      const response = await users.new(request);
      expect(response).toEqual('ok new');
    });
  });

  describe('currentUser()', () => {
    it('should request the logged in user', async () => {
      const response = await users.currentUser();
      expect(response).toEqual({ name: 'doe' });
    });
  });

  describe('get()', () => {
    it('should get all the users', async () => {
      spyOn(api, 'get').and.callFake(async () => Promise.resolve({ json: ['users'] }));
      const request = {};
      const response = await users.get(request);
      expect(api.get).toHaveBeenCalledWith('users', request);
      expect(response).toEqual(['users']);
    });
  });

  describe('delete()', () => {
    it('should delete the user', async () => {
      const user = { _id: '1234' };
      spyOn(api, 'delete').and.callFake(async () => Promise.resolve({ json: 'ok' }));
      const response = await users.delete(user);
      expect(api.delete).toHaveBeenCalledWith('users', user);
      expect(response).toEqual('ok');
    });
  });
});
