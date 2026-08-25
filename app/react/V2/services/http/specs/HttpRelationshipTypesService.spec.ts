/**
 * @jest-environment jsdom
 */
import * as relationshipTypesApi from '#V2/api/relationshiptypes/index.js';
import { httpRelationshipTypesService } from '../HttpRelationshipTypesService.js';

jest.mock('#V2/api/relationshiptypes', () => ({
  getAll: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
  countByRelationTypes: jest.fn(),
}));

describe('HttpRelationshipTypesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAll delegates to the relationship types API', async () => {
    const rows = [{ _id: 'rt1', name: 'Related to' }];
    jest.mocked(relationshipTypesApi.getAll).mockResolvedValue([rows, undefined]);

    const [data, error] = await httpRelationshipTypesService.getAll();

    expect(relationshipTypesApi.getAll).toHaveBeenCalledWith(undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(rows);
  });

  it('countByTypes delegates to the relationship types API', async () => {
    const { signal } = new AbortController();
    jest.mocked(relationshipTypesApi.countByRelationTypes).mockResolvedValue({ rt1: 3 });

    const [data, error] = await httpRelationshipTypesService.countByTypes(['rt1'], { signal });

    expect(relationshipTypesApi.countByRelationTypes).toHaveBeenCalledWith(['rt1'], signal);
    expect(error).toBeUndefined();
    expect(data).toEqual({ rt1: 3 });
  });

  it('upsert delegates to the relationship types API', async () => {
    const input = { name: 'Mentions' };
    const saved = { _id: 'rt2', name: 'Mentions' };
    jest.mocked(relationshipTypesApi.upsert).mockResolvedValue([saved, undefined]);

    const [data, error] = await httpRelationshipTypesService.upsert(input);

    expect(relationshipTypesApi.upsert).toHaveBeenCalledWith(input, undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });

  it('delete removes each id and returns the first error', async () => {
    jest.mocked(relationshipTypesApi.remove).mockResolvedValueOnce([undefined]);
    jest
      .mocked(relationshipTypesApi.remove)
      .mockResolvedValueOnce([undefined as never, { message: 'fail' } as never]);

    const [data, error] = await httpRelationshipTypesService.delete(['rt1', 'rt2']);

    expect(relationshipTypesApi.remove).toHaveBeenCalledTimes(2);
    expect(data).toBeUndefined();
    expect(error).toEqual({ message: 'fail' });
  });
});
