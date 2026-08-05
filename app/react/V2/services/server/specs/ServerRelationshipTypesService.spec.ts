import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import { createServerRelationshipTypesService } from '../ServerRelationshipTypesService.js';

const ctx = { headers: { cookie: 'session=1' } };
const service = createServerRelationshipTypesService(ctx);

describe('ServerRelationshipTypesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getAll returns rows with string _id', async () => {
    jest.spyOn(GetRelationshipTypesUseCaseFactory, 'default').mockReturnValue({
      execute: async () => [
        { id: 'rel1', name: 'Related to' },
        { id: 'rel2', name: 'Part of' },
      ],
    } as never);

    const [data, error] = await service.getAll();

    expect(error).toBeUndefined();
    expect(data).toEqual([
      { _id: 'rel1', name: 'Related to' },
      { _id: 'rel2', name: 'Part of' },
    ]);
  });

  it('upsert returns not implemented', async () => {
    const [data, error] = await service.upsert({ name: 'Related to' });

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });

  it('delete returns not implemented', async () => {
    const [data, error] = await service.delete(['rt1']);

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });
});
