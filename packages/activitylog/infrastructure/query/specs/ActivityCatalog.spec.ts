import { ActivityCatalog } from '../ActivityCatalog.js';

describe('ActivityCatalog', () => {
  describe('routesDescribedAs()', () => {
    it('should find the routes whose description contains the text, whatever its case', () => {
      expect(ActivityCatalog.routesDescribedAs('NEW USER')).toEqual([
        { method: 'POST', url: '/api/users/new' },
      ]);
    });

    it('should find every route sharing the description', () => {
      expect(ActivityCatalog.routesDescribedAs('deleted entity')).toEqual([
        { method: 'DELETE', url: '/api/entities' },
        { method: 'DELETE', url: '/api/documents' },
      ]);
    });

    it('should find nothing for a text no description contains', () => {
      expect(ActivityCatalog.routesDescribedAs('other content')).toEqual([]);
    });
  });

  describe('routesForActions()', () => {
    it('should find the routes of an action by the HTTP method it is made with', () => {
      const routes = ActivityCatalog.routesForActions(['DELETE']);

      expect(routes).toContainEqual({ method: 'DELETE', url: '/api/entities' });
      expect(routes).toContainEqual({ method: 'DELETE', url: '/api/translations/languages' });
      expect(routes).not.toContainEqual({ method: 'POST', url: '/api/entities' });
    });

    it('should also find a deleting route made with another method that names it in its path', () => {
      expect(ActivityCatalog.routesForActions(['DELETE'])).toContainEqual({
        method: 'POST',
        url: '/api/entities/bulkdelete',
      });
    });

    it('should take creating as a POST the catalog describes as a creation', () => {
      const routes = ActivityCatalog.routesForActions(['CREATE']);

      expect(routes).toContainEqual({ method: 'POST', url: '/api/users/new' });
      expect(routes).toContainEqual({ method: 'POST', url: '/api/entities' });
      expect(routes).not.toContainEqual({ method: 'POST', url: '/api/settings' });
      expect(routes.every(({ method }) => method === 'POST')).toBe(true);
    });

    it('should take updating as a POST the catalog describes as an update', () => {
      const routes = ActivityCatalog.routesForActions(['UPDATE']);

      expect(routes).toContainEqual({ method: 'POST', url: '/api/users' });
      expect(routes).toContainEqual({ method: 'POST', url: '/api/settings' });
      expect(routes).not.toContainEqual({ method: 'POST', url: '/api/users/new' });
    });

    it('should find nothing for an HTTP method that names no action or description', () => {
      expect(ActivityCatalog.routesForActions(['PUT'])).toEqual([]);
    });

    it('should take an action as plain text, not as a pattern', () => {
      expect(ActivityCatalog.routesForActions(['.'])).toEqual([]);
      expect(ActivityCatalog.routesForActions(['(A+)+$'])).toEqual([]);
    });

    it('should find nothing when no action is asked for', () => {
      expect(ActivityCatalog.routesForActions([])).toEqual([]);
    });
  });
});
