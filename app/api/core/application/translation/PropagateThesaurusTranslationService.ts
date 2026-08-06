import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesaurusMetadataRenamer } from '#api/core/application/contracts/ThesaurusMetadataRenamer.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';

type TranslationValueLike = {
  key?: string;
  value?: string;
};

type ContextLike = {
  id?: string;
  type?: string;
  values?: TranslationValueLike[];
};

type LocaleTranslationLike = {
  locale?: string;
  contexts?: ContextLike[];
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

class PropagateThesaurusTranslationService {
  constructor(private deps: Deps) {}

  async forLocale(
    translation: LocaleTranslationLike,
    previousContexts: ContextLike[] = []
  ): Promise<void> {
    await previousContexts.reduce(async (promise, context) => {
      await promise;
      return this.forContext(translation, context);
    }, Promise.resolve());
  }

  async forContext(
    translation: LocaleTranslationLike,
    previousContext: ContextLike
  ): Promise<void> {
    const incomingContext = (translation.contexts || []).find(
      context => context.id?.toString() === previousContext.id?.toString()
    );

    if (!incomingContext || incomingContext.type !== 'Thesaurus' || !previousContext.id) {
      return;
    }

    const thesaurusResult = await this.deps.thesauriDS.getById(previousContext.id);
    const thesaurusValues = thesaurusResult.isOk()
      ? (thesaurusResult.getDataOrThrow() as Thesaurus).values
      : [];
    const flattenedThesaurusValues = flattenThesaurusValues(thesaurusValues as ThesaurusOption[]);

    const valuesChanged = (incomingContext.values || []).reduce<Record<string, string>>(
      (changes, value) => {
        const currentValue = (previousContext.values || []).find(v => v.key === value.key);
        if (currentValue?.key && currentValue.value !== value.value && value.value) {
          return { ...changes, [currentValue.key]: value.value };
        }
        return changes;
      },
      {}
    );

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
      (change, index, allChanges) => allChanges.findIndex(c => c.id === change.id) === index
    );

    await Promise.all(
      uniqueChanges.map(async change =>
        this.deps.metadataRenamer.renameInMetadata(
          change.id,
          change.value,
          previousContext.id!,
          translation.locale!
        )
      )
    );
  }
}

export { PropagateThesaurusTranslationService };
export type { ContextLike, LocaleTranslationLike };
