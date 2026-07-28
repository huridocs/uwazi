import { ObjectId } from 'mongodb';
import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import { createServerRelationshipTypesService } from '../ServerRelationshipTypesService.js';

jest.mock(
  '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js',
  () => ({
    GetRelationshipTypesUseCaseFactory: { default: jest.fn() },
  })
);

const mockExecute = jest.fn();
const ctx = { headers: { cookie: 'session=1' } };
const service = createServerRelationshipTypesService(ctx);

describe('ServerRelationshipTypesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(GetRelationshipTypesUseCaseFactory.default).mockReturnValue({
      execute: mockExecute,
    } as never);
  });

  it('getAll returns rows with string _id', async () => {
    const id = new ObjectId();
    mockExecute.mockResolvedValue([{ id: id.toString(), name: 'Related to' }] as never);

    const [data, error] = await service.getAll();

    expect(GetRelationshipTypesUseCaseFactory.default).toHaveBeenCalledWith();
    expect(mockExecute).toHaveBeenCalledWith({});
    expect(error).toBeUndefined();
    expect(data).toEqual([{ _id: id.toString(), name: 'Related to' }]);
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
