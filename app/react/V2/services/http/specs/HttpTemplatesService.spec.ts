/**
 * @jest-environment jsdom
 */
import * as templatesApi from '#V2/api/templates/index.js';
import { httpTemplatesService } from '../HttpTemplatesService.js';

jest.mock('#V2/api/templates', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  checkEntityCounts: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
  setDefault: jest.fn(),
}));

describe('HttpTemplatesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAll delegates to the templates API', async () => {
    const rows = [{ _id: 't1', name: 'Document' }];
    jest.mocked(templatesApi.getAll).mockResolvedValue([rows, undefined]);

    const [data, error] = await httpTemplatesService.getAll();

    expect(templatesApi.getAll).toHaveBeenCalledWith(undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(rows);
  });

  it('upsert delegates to the templates API', async () => {
    const input = { name: 'Case' };
    const saved = { _id: 't2', name: 'Case' };
    jest.mocked(templatesApi.upsert).mockResolvedValue([saved, undefined]);

    const [data, error] = await httpTemplatesService.upsert(input);

    expect(templatesApi.upsert).toHaveBeenCalledWith(input, undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });

  it('delete removes each id and returns the first error', async () => {
    jest.mocked(templatesApi.remove).mockResolvedValueOnce([undefined]);
    jest
      .mocked(templatesApi.remove)
      .mockResolvedValueOnce([undefined as never, { message: 'fail' } as never]);

    const [data, error] = await httpTemplatesService.delete(['t1', 't2']);

    expect(templatesApi.remove).toHaveBeenCalledTimes(2);
    expect(data).toBeUndefined();
    expect(error).toEqual({ message: 'fail' });
  });

  it('setDefault delegates to the templates API', async () => {
    const saved = { _id: 't1', name: 'Document', default: true };
    jest.mocked(templatesApi.setDefault).mockResolvedValue([saved, undefined]);

    const [data, error] = await httpTemplatesService.setDefault('t1');

    expect(templatesApi.setDefault).toHaveBeenCalledWith('t1', undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });

  it('checkEntityCounts delegates to the templates API', async () => {
    jest.mocked(templatesApi.checkEntityCounts).mockResolvedValue([{ t1: 3 }, undefined]);

    const [data, error] = await httpTemplatesService.checkEntityCounts(['t1']);

    expect(templatesApi.checkEntityCounts).toHaveBeenCalledWith(['t1'], undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual({ t1: 3 });
  });
});
