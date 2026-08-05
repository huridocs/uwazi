import { createTestingThesaurisService } from '../TestingThesaurisService.js';

describe('TestingThesaurisService', () => {
  it('tracks in-memory thesauri across getAll, upsert, and delete', async () => {
    const service = createTestingThesaurisService({
      initialThesauri: [{ _id: 't1', name: 'Colors', values: [] }],
    });

    const [initial] = await service.getAll();
    expect(initial).toHaveLength(1);

    await service.upsert({ name: 'Animals', values: [] });
    const [afterUpsert] = await service.getAll();
    expect(afterUpsert).toHaveLength(2);

    await service.delete(['t1']);
    expect(service.snapshot().map(item => item._id)).toEqual([expect.any(String)]);
  });
});
