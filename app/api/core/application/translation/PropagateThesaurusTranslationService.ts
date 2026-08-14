import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';

type ThesaurusValueChange = {
  locale: string;
  contextId: string;
  type?: string;
  previous: Record<string, string>;
  next: Record<string, string>;
};

type ThesaurusOption = {
  id?: string;
  label?: string;
  values?: ThesaurusOption[];
};

type Deps = {
  thesauriDS: ThesauriDataSource;
  metadataRenamer: ThesaurusMetadataRenamer;
};

const flattenThesaurusValues = (values: ThesaurusOption[] = []): ThesaurusOption[] =>
  values.reduce<ThesaurusOption[]>(
    (allValues, value) => [...allValues, value, ...flattenThesaurusValues(value.values)],
    []
  );

function diffChangedValues(previous: Record<string, string>, next: Record<string, string>) {
  const changes: Record<string, string> = {};
  Object.entries(next).forEach(([key, value]) => {
    if (value && previous[key] !== undefined && previous[key] !== value) {
      changes[key] = value;
    }
  });
  return changes;
}

class PropagateThesaurusTranslationService {
  constructor(private deps: Deps) {}

  async propagate(change: ThesaurusValueChange): Promise<void> {
    if (change.type !== 'Thesaurus' || !change.contextId || !change.locale) {
      return;
    }

    const thesaurusResult = await this.deps.thesauriDS.getById(change.contextId);
    const thesaurusValues = thesaurusResult.isOk()
      ? (thesaurusResult.getDataOrThrow() as Thesaurus).values
      : [];
    const flattenedThesaurusValues = flattenThesaurusValues(thesaurusValues as ThesaurusOption[]);

    const valuesChanged = diffChangedValues(change.previous, change.next);

    const changesMatchingDictionaryId = Object.keys(valuesChanged).reduce(
      (changes, valueChanged) => {
        const matchingValues = flattenedThesaurusValues.filter(v => v.label === valueChanged);
        const nextChanges = matchingValues
          .filter(value => value.id)
          .map(value => ({ id: value.id as string, value: valuesChanged[valueChanged] }));

        return changes.concat(nextChanges);
      },
      [] as { id: string; value: string }[]
    );

    const uniqueChanges = changesMatchingDictionaryId.filter(
      (item, index, allChanges) => allChanges.findIndex(c => c.id === item.id) === index
    );

    await Promise.all(
      uniqueChanges.map(async item =>
        this.deps.metadataRenamer.renameInMetadata(
          item.id,
          item.value,
          change.contextId,
          change.locale
        )
      )
    );
  }
}

export { PropagateThesaurusTranslationService };
export type { ThesaurusValueChange };
