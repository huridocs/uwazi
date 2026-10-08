import { RouteRegistry } from '../../../routing/RouteRegistry.js';
import { ArchivesRoutes } from '../../ArchivesRoutes.js';

describe('ArchivesRoutes', () => {
  it('should register archives list outside any tenant', () => {
    expect(ArchivesRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['archives list', 'none'],
    ]);
  });

  it('should only need MongoDB and PostgreSQL, never Redis or the session store', () => {
    ArchivesRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false, sessions: false }));
  });

  it('should take an empty request', () => {
    const [list] = ArchivesRoutes.all();

    expect(list.request.parse({})).toEqual({});
  });

  it('should reject unknown request fields, tenant included', () => {
    const [list] = ArchivesRoutes.all();

    expect(() => list.request.parse({ tenant: 'acme' })).toThrow();
  });

  it('should be known to the uwazi binary', () => {
    expect(RouteRegistry.all().map(r => `${r.group} ${r.name}`)).toContain('archives list');
  });
});
