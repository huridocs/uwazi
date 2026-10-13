import { ActivityLogEntry } from '../ActivityLogEntry.js';

const request = {
  id: 'entry1',
  method: 'POST',
  url: '/api/entities',
  params: { some: 'params' },
  query: { a: 'query' },
  body: { title: 'Hi' } as Record<string, unknown>,
  user: { id: 'user1', username: 'admin' },
  time: 1_000,
};

describe('ActivityLogEntry', () => {
  describe('record()', () => {
    it('should keep who made the request, when, and its details as JSON', () => {
      expect(ActivityLogEntry.record(request).props).toEqual({
        id: 'entry1',
        method: 'POST',
        url: '/api/entities',
        params: '{"some":"params"}',
        query: '{"a":"query"}',
        body: '{"title":"Hi"}',
        userId: 'user1',
        username: 'admin',
        time: 1_000,
      });
    });

    it('should never keep the password sent in the body', () => {
      const entry = ActivityLogEntry.record({
        ...request,
        body: { title: 'Hi', password: '12345' },
      });

      expect(entry.props.body).toBe('{"title":"Hi","password":"*****"}');
    });

    it('should mask a password wherever it is in the body', () => {
      const entry = ActivityLogEntry.record({
        ...request,
        body: {
          user: { username: 'ana', password: '12345', profile: { password: 'deeper' } },
          users: [{ password: 'first' }, { name: 'no password' }],
          title: 'password',
        },
      });

      expect(JSON.parse(entry.props.body)).toEqual({
        user: { username: 'ana', password: '*****', profile: { password: '*****' } },
        users: [{ password: '*****' }, { name: 'no password' }],
        title: 'password',
      });
    });

    it('should not look for passwords inside JSON carried as text', () => {
      const entity = '{"password":"12345"}';

      const entry = ActivityLogEntry.record({ ...request, body: { entity } });

      expect(JSON.parse(entry.props.body)).toEqual({ entity });
    });

    it('should leave the body it was given untouched', () => {
      const body = { password: '12345', user: { password: 'nested' } };

      ActivityLogEntry.record({ ...request, body });

      expect(body).toEqual({ password: '12345', user: { password: 'nested' } });
    });

    it('should not add a password to a body that carries none', () => {
      const entry = ActivityLogEntry.record({ ...request, body: { password: '' } });

      expect(entry.props.body).toBe('{"password":""}');
    });

    it('should belong to nobody when the request was made without a user', () => {
      const entry = ActivityLogEntry.record({ ...request, user: null });

      expect(entry.props).toMatchObject({ userId: null, username: null });
    });
  });

  describe('restore()', () => {
    it('should carry the stored entry as it is', () => {
      const props = {
        id: 'entry1',
        method: 'DELETE',
        url: '/api/files',
        params: '{}',
        query: '{"_id":"file1"}',
        body: '{"password":"kept as stored"}',
        userId: null,
        username: null,
        time: 2_000,
      };

      expect(ActivityLogEntry.restore(props).props).toEqual(props);
    });
  });
});
