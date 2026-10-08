import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { User } from '#api/users.v2/model/User.js';
import * as entityCounts from '#api/entities.v2/routes/index.js';
import { createServerTemplatesService } from '../ServerTemplatesService.js';

const ctx = { headers: { cookie: 'session=1' } };
const service = createServerTemplatesService(ctx);

describe('ServerTemplatesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getAll returns rows with string _id', async () => {
    jest.spyOn(TemplatesDAOFactory, 'default').mockReturnValue({
      get: async () => [
        { _id: { toString: () => 'tmpl1' }, name: 'Document' },
        { _id: { toString: () => 'tmpl2' }, name: 'Case' },
      ],
    } as never);

    const [data, error] = await service.getAll();

    expect(error).toBeUndefined();
    expect(data).toEqual([
      { _id: 'tmpl1', name: 'Document' },
      { _id: 'tmpl2', name: 'Case' },
    ]);
  });

  it('checkEntityCounts returns every template count', async () => {
    jest.spyOn(entityCounts, 'countAllByTemplate').mockResolvedValue({ tmpl1: 4, tmpl2: 0 });

    const [data, error] = await service.checkEntityCounts();

    expect(error).toBeUndefined();
    expect(data).toEqual({ tmpl1: 4, tmpl2: 0 });
    expect(entityCounts.countAllByTemplate).toHaveBeenCalledWith(User.createFrom(null));
  });

  it('upsert returns not implemented', async () => {
    const [data, error] = await service.upsert({ name: 'Document' });

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });

  it('delete returns not implemented', async () => {
    const [data, error] = await service.delete(['tmpl1']);

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });

  it('setDefault returns not implemented', async () => {
    const [data, error] = await service.setDefault('tmpl1');

    expect(data).toBeUndefined();
    expect(error?.message).toContain('Not implemented');
  });
});
