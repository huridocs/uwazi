import { createTestingTemplatesService } from '../TestingTemplatesService.js';

describe('TestingTemplatesService', () => {
  it('tracks in-memory templates across getAll, upsert, setDefault, and delete', async () => {
    const service = createTestingTemplatesService({
      initialTemplates: [{ _id: 't1', name: 'Document', default: true }],
      initialEntityCounts: { t1: 2 },
    });

    const [initial] = await service.getAll();
    expect(initial).toHaveLength(1);

    const [counts] = await service.checkEntityCounts(['t1']);
    expect(counts).toEqual({ t1: 2 });

    await service.upsert({ name: 'Case' });
    const [afterUpsert] = await service.getAll();
    expect(afterUpsert).toHaveLength(2);

    await service.setDefault(afterUpsert![1]._id);
    expect(service.snapshot().find(item => item._id === 't1')?.default).toBe(false);
    expect(service.snapshot().find(item => item.name === 'Case')?.default).toBe(true);

    await service.delete(['t1']);
    expect(service.snapshot().map(item => item.name)).toEqual(['Case']);
  });
});
