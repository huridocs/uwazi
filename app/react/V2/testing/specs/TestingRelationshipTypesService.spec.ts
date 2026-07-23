import { createTestingRelationshipTypesService } from '../TestingRelationshipTypesService.js';

describe('TestingRelationshipTypesService', () => {
  it('tracks in-memory relationship types across getAll, upsert, and delete', async () => {
    const service = createTestingRelationshipTypesService({
      initialRelationshipTypes: [{ _id: 'rt1', name: 'Related to' }],
    });

    const [initial] = await service.getAll();
    expect(initial).toHaveLength(1);

    await service.upsert({ name: 'Mentions' });
    const [afterUpsert] = await service.getAll();
    expect(afterUpsert).toHaveLength(2);

    await service.delete(['rt1']);
    expect(service.snapshot().map(item => item._id)).toEqual([expect.any(String)]);
  });
});
