import { ObjectId } from 'mongodb';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { createServerThesaurusService } from '../ServerThesaurusService.js';

jest.mock('#api/core/infrastructure/factories/ThesauriDAOFactory.js', () => ({
  ThesauriDAOFactory: { default: jest.fn() },
}));

const mockGet = jest.fn();
jest.mocked(ThesauriDAOFactory.default).mockReturnValue({ get: mockGet } as never);

const ctx = { headers: { cookie: 'session=1' } };
const service = createServerThesaurusService(ctx);

describe('ServerThesaurusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ThesauriDAOFactory.default).mockReturnValue({ get: mockGet } as never);
  });

  it('getAll returns rows with string _id', async () => {
    const id = new ObjectId();
    mockGet.mockResolvedValue([{ _id: id, name: 'Colors', values: [] }]);

    const [data, error] = await service.getAll();

    expect(mockGet).toHaveBeenCalledWith();
    expect(error).toBeUndefined();
    expect(data).toEqual([{ _id: id.toString(), name: 'Colors', values: [] }]);
  });

  it('getById returns matching row', async () => {
    const id = new ObjectId();
    mockGet.mockResolvedValue([{ _id: id, name: 'Colors', values: [] }]);

    const [data, error] = await service.getById(id.toString());

    expect(mockGet).toHaveBeenCalledWith([id.toString()]);
    expect(error).toBeUndefined();
    expect(data).toEqual({ _id: id.toString(), name: 'Colors', values: [] });
  });

  it('getById returns undefined when not found', async () => {
    mockGet.mockResolvedValue([]);

    const [data, error] = await service.getById('000000000000000000000000');

    expect(error).toBeUndefined();
    expect(data).toBeUndefined();
  });

  it('upsert returns not implemented', async () => {
    const [data, error] = await service.upsert({ name: 'Colors', values: [] });

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });
});
