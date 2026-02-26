import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PendingThesauriValuesApplier } from '../PendingThesauriValuesApplier';
import { CsvImportThesauriValues } from '../../../domain/CsvImportThesauriValues';
import { CsvThesauriPendingEntry } from '../../../domain/CsvThesauriPendingValues';
import { ThesauriRepository, ThesaurusValueInput } from '../../contracts/ThesauriRepository';
import { TranslationsRepository } from '../../contracts/TranslationsRepository';

const createTranslationsRepo = (): TranslationsRepository => ({
  async updateEntries(): Promise<void> {
    /* noop */
  },
});

const createThesauriRepo = (initial: ThesaurusSchema): ThesauriRepository => {
  let counter = 0;
  let thesaurus = initial;

  const nextId = () => {
    counter += 1;
    return `id-${counter}`;
  };

  return {
    async getById() {
      return thesaurus;
    },
    async appendValues(
      _thesaurusId: string,
      values: ThesaurusValueInput[]
    ): Promise<ThesaurusSchema> {
      const existingValues = thesaurus.values || [];

      values.forEach(rootToAppend => {
        const existingRoot = existingValues.find(v => v.label === rootToAppend.label);

        if (existingRoot) {
          const existingChildren = existingRoot.values || [];
          const childrenToAdd =
            rootToAppend.values?.map(child => ({
              id: nextId(),
              label: child.label,
            })) || [];
          existingRoot.values = [...existingChildren, ...childrenToAdd];
        } else {
          const withIds = {
            id: nextId(),
            label: rootToAppend.label,
            values:
              rootToAppend.values?.map(child => ({
                id: nextId(),
                label: child.label,
              })) || [],
          };
          existingValues.push(withIds);
        }
      });

      thesaurus = { ...thesaurus, values: existingValues };
      return thesaurus;
    },
  };
};

const buildPendingDoc = ({
  importId,
  thesaurusId,
  rootLabel,
  childLabel,
}: {
  importId: string;
  thesaurusId: string;
  rootLabel: string;
  childLabel?: string;
}) => {
  const entry = new CsvThesauriPendingEntry({
    propertyId: 'prop-id',
    propertyName: 'prop-name',
    thesaurusId,
    type: 'select',
  });
  const root = entry.ensureRoot({
    label: rootLabel,
    normalized: rootLabel.toLowerCase(),
    languages: { en: rootLabel },
  });
  if (childLabel) {
    root.ensureChild({
      label: childLabel,
      normalized: childLabel.toLowerCase(),
      languages: { en: childLabel },
    });
  }
  return CsvImportThesauriValues.create({
    importId,
    thesaurusId,
    createdAt: Date.now(),
    entries: [entry],
  });
};

describe('PendingThesauriValuesApplier', () => {
  it('should include existing IDs in appliedValues when no appends are needed', async () => {
    const thesaurusId = 'th-1';
    const existing: ThesaurusSchema = {
      name: 'th',
      values: [
        {
          id: 'root-id',
          label: 'Root',
          values: [{ id: 'child-id', label: 'Child' }],
        },
      ],
    };

    const applier = new PendingThesauriValuesApplier({
      thesauriRepo: createThesauriRepo(existing),
      translationsRepo: createTranslationsRepo(),
    });

    const pendingDoc = buildPendingDoc({
      importId: 'imp-1',
      thesaurusId,
      rootLabel: 'Root',
      childLabel: 'Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend).toHaveLength(0);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        { label: 'Root', valueId: 'root-id' },
        { label: 'Child', parentLabel: 'Root', valueId: 'child-id' },
      ])
    );
  });

  it('should capture newly appended IDs in appliedValues', async () => {
    const thesaurusId = 'th-2';
    const applier = new PendingThesauriValuesApplier({
      thesauriRepo: createThesauriRepo({ name: 'th', values: [] }),
      translationsRepo: createTranslationsRepo(),
    });

    const pendingDoc = buildPendingDoc({
      importId: 'imp-2',
      thesaurusId,
      rootLabel: 'New Root',
      childLabel: 'New Child',
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(appliedValues).toHaveLength(2);
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'New Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'New Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });

  // eslint-disable-next-line max-statements
  it('should include existing and new values together', async () => {
    const thesaurusId = 'th-3';
    const existing: ThesaurusSchema = {
      name: 'th',
      values: [
        {
          id: 'root-id',
          label: 'Root',
          values: [{ id: 'existing-child-id', label: 'Existing Child' }],
        },
        {
          id: 'standalone-id',
          label: 'Standalone Existing',
        },
      ],
    };

    const applier = new PendingThesauriValuesApplier({
      thesauriRepo: createThesauriRepo(existing),
      translationsRepo: createTranslationsRepo(),
    });

    const entry = new CsvThesauriPendingEntry({
      propertyId: 'prop-id',
      propertyName: 'prop-name',
      thesaurusId,
      type: 'select',
    });
    const root = entry.ensureRoot({
      label: 'Root',
      normalized: 'root',
      languages: { en: 'Root' },
    });
    root.ensureChild({
      label: 'Existing Child',
      normalized: 'existing child',
      languages: { en: 'Existing Child' },
    });
    root.ensureChild({
      label: 'New Child',
      normalized: 'new child',
      languages: { en: 'New Child' },
    });

    const standalone = entry.ensureRoot({
      label: 'Standalone Existing',
      normalized: 'standalone existing',
      languages: { en: 'Standalone Existing' },
    });
    standalone.ensureChild({
      label: 'New Standalone Child',
      normalized: 'new standalone child',
      languages: { en: 'New Standalone Child' },
    });

    entry.ensureRoot({
      label: 'New Standalone Root',
      normalized: 'new standalone root',
      languages: { en: 'New Standalone Root' },
    });

    const pendingDoc = CsvImportThesauriValues.create({
      importId: 'imp-3',
      thesaurusId,
      createdAt: Date.now(),
      entries: [entry],
    });

    const { diff, appliedValues } = await applier.apply(pendingDoc);

    expect(diff.valuesToAppend.length).toBeGreaterThan(0);
    expect(diff.valuesToAppend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Root',
          values: expect.arrayContaining([expect.objectContaining({ label: 'New Child' })]),
        }),
        expect.objectContaining({
          label: 'Standalone Existing',
          values: expect.arrayContaining([
            expect.objectContaining({ label: 'New Standalone Child' }),
          ]),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
        }),
      ])
    );
    expect(appliedValues).toEqual(
      expect.arrayContaining([
        { label: 'Root', valueId: 'root-id' },
        {
          label: 'Existing Child',
          parentLabel: 'Root',
          valueId: 'existing-child-id',
        },
        { label: 'Standalone Existing', valueId: 'standalone-id' },
        expect.objectContaining({
          label: 'New Child',
          parentLabel: 'Root',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Child',
          parentLabel: 'Standalone Existing',
          valueId: expect.any(String),
        }),
        expect.objectContaining({
          label: 'New Standalone Root',
          valueId: expect.any(String),
        }),
      ])
    );
  });
});
