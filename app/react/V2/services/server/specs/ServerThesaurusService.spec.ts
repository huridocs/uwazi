import { ObjectId } from 'mongodb';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { httpThesaurusService } from '../../http/HttpThesaurusService.js';
import { createServerThesaurusService } from '../ServerThesaurusService.js';

jest.mock('#api/core/infrastructure/factories/ThesauriDAOFactory.js', () => ({
  ThesauriDAOFactory: { default: jest.fn() },
}));

jest.mock('#V2/api/thesauri', () => ({
  get: jest.fn(),
  save: jest.fn(),
  deleteThesauri: jest.fn(),
  importThesaurus: jest.fn(),
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

  it('upsert delegates to the HTTP service with request headers', async () => {
    const thesaurus = { name: 'Colors', values: [] };
    const saved = { _id: 'thesaurus1', ...thesaurus };
    const upsertSpy = jest
      .spyOn(httpThesaurusService, 'upsert')
      .mockResolvedValue([saved, undefined]);

    const [data, error] = await service.upsert(thesaurus);

    expect(upsertSpy).toHaveBeenCalledWith(thesaurus, { headers: ctx.headers });
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });
});
