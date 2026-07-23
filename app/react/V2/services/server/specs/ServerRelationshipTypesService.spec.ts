import { ObjectId } from 'mongodb';
import relationtypes from '#api/relationtypes/relationtypes.js';
import { createServerRelationshipTypesService } from '../ServerRelationshipTypesService.js';

jest.mock('#api/relationtypes/relationtypes.js', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = jest.mocked(relationtypes.get);
const ctx = { headers: { cookie: 'session=1' } };
const service = createServerRelationshipTypesService(ctx);

describe('ServerRelationshipTypesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAll returns rows with string _id', async () => {
    const id = new ObjectId();
    mockGet.mockResolvedValue([{ _id: id, name: 'Related to' }] as never);

    const [data, error] = await service.getAll();

    expect(mockGet).toHaveBeenCalledWith();
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
