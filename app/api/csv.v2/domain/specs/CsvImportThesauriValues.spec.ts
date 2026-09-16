import { CsvImportThesauriValues } from '../CsvImportThesauriValues.js';

describe('CsvImportThesauriValues', () => {
  it('should carry id through create, toObject and withAppliedValues', () => {
    const pending = CsvImportThesauriValues.create({
      id: 'thesauri-1',
      importId: 'import-1',
      thesaurusId: 'thesaurus-1',
      createdAt: 100,
      entries: [],
    });

    expect(pending.id).toBe('thesauri-1');
    expect(pending.toObject().id).toBe('thesauri-1');
    expect(
      pending.withAppliedValues({ observedValues: 0, createdCount: 0 }, []).id
    ).toBe('thesauri-1');
  });
});
