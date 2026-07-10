/**
 * @jest-environment jsdom
 */
import * as thesauriApi from '#V2/api/thesauri/index.js';
import { httpThesaurusService } from '../HttpThesaurusService.js';

jest.mock('#V2/api/thesauri', () => ({
  get: jest.fn(),
  save: jest.fn(),
  deleteThesauri: jest.fn(),
  importThesaurus: jest.fn(),
}));

describe('HttpThesaurusService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('importFromFile delegates to the thesauri API', async () => {
    const file = new File(['label'], 'values.csv', { type: 'text/csv' });
    const thesaurus = { name: 'Colors', values: [] };
    const saved = { _id: 'thesaurus1', ...thesaurus };

    jest.mocked(thesauriApi.importThesaurus).mockResolvedValue(saved);

    const [data, error] = await httpThesaurusService.importFromFile(thesaurus, file);

    expect(thesauriApi.importThesaurus).toHaveBeenCalledWith(thesaurus, file);
    expect(error).toBeUndefined();
    expect(data).toEqual(saved);
  });
});
