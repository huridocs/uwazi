import { UsageRoutes } from '../../UsageRoutes.js';

describe('UsageRoutes', () => {
  it('should register usage report for one tenant or every tenant', () => {
    expect(UsageRoutes.all().map(r => [`${r.group} ${r.name}`, r.tenancy])).toEqual([
      ['usage report', 'single-or-all'],
    ]);
  });

  it('should need Elasticsearch, not Redis', () => {
    UsageRoutes.all().forEach(r => expect(r.needs).toEqual({ redis: false, elasticsearch: true }));
  });

  it('should take an empty request and reject unknown fields, tenant included', () => {
    const [report] = UsageRoutes.all();

    expect(report.request.parse({})).toEqual({});
    expect(() => report.request.parse({ tenant: 'acme' })).toThrow();
  });
});
