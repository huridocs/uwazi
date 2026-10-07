import { RouteRegistry } from '../../../routing/RouteRegistry.js';
import { SessionsRoutes } from '../../SessionsRoutes.js';

describe('SessionsRoutes', () => {
  it('should register sessions last for one tenant or every tenant', () => {
    expect(SessionsRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['sessions last', 'single-or-all'],
    ]);
  });

  it('should need the session store, not Redis', () => {
    SessionsRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false, sessions: true }));
  });

  it('should take an empty request and reject unknown fields, tenant included', () => {
    const [last] = SessionsRoutes.all();

    expect(last.request.parse({})).toEqual({});
    expect(() => last.request.parse({ tenant: 'acme' })).toThrow();
  });

  it('should be known to the uwazi binary', () => {
    expect(RouteRegistry.all().map(r => `${r.group} ${r.name}`)).toContain('sessions last');
  });
});
