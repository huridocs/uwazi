import { RouteRegistry } from '../../../routing/RouteRegistry.js';
import { ActivityRoutes } from '../../ActivityRoutes.js';

describe('ActivityRoutes', () => {
  it('should register activity list for exactly one tenant', () => {
    expect(ActivityRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['activity list', 'single'],
    ]);
  });

  it('should only need MongoDB and PostgreSQL, never Redis or the session store', () => {
    ActivityRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false, sessions: false }));
  });

  it('should default the limit to 20 when the request is empty', () => {
    const [list] = ActivityRoutes.all();

    expect(list.request.parse({})).toEqual({ limit: 20 });
  });

  it('should reject unknown request fields, tenant included', () => {
    const [list] = ActivityRoutes.all();

    expect(() => list.request.parse({ tenant: 'acme' })).toThrow();
  });

  it('should be known to the uwazi binary', () => {
    expect(RouteRegistry.all().map(r => `${r.group} ${r.name}`)).toContain('activity list');
  });
});
