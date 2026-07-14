/**
 * @jest-environment jsdom
 */
import * as thesauriApi from '#V2/api/thesauri/index.js';
import { httpThesaurusService } from '../HttpThesaurusService.js';

jest.mock('#V2/api/thesauri', () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
  importFromFile: jest.fn(),
}));

describe('HttpThesaurusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('importFromFile delegates to the thesauri API', async () => {
    const file = new File(['label'], 'values.csv', { type: 'text/csv' });
    const thesaurus = { name: 'Colors', values: [] };
    const saved = { _id: 'thesaurus1', ...thesaurus };

    jest.mocked(thesauriApi.importFromFile).mockResolvedValue([saved, undefined]);

    const [data, error] = await httpThesaurusService.importFromFile(thesaurus, file);

    expect(thesauriApi.importFromFile).toHaveBeenCalledWith(thesaurus, file, undefined);
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });
});
