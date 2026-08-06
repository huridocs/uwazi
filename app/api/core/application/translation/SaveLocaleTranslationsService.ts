import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationContext, TranslationType, TranslationValue } from '#shared/translationType.js';

type IndexedContextValues = Record<string, string>;

type IndexedContext = Omit<TranslationContext, 'values'> & {
  values: IndexedContextValues;
};

type IndexedLocaleTranslation = Omit<TranslationType, 'contexts'> & {
  contexts?: IndexedContext[];
};

type Deps = {
  transactionManager: TransactionManager;
  translationsDS: TranslationsDataSource;
  query: TranslationsQueryService;
  createTranslationEntries: CreateTranslationEntriesUseCase;
  updateTranslationEntries: UpdateTranslationEntriesUseCase;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type LocaleTranslationInput = TranslationType | IndexedLocaleTranslation;

function checkDuplicateKeys(
  context: TranslationContext | IndexedContext,
  values: TranslationValue[]
) {
  if (!values) return;

  const seen = new Set<string | undefined>();
  values.forEach(value => {
    if (seen.has(value.key)) {
      throw new Error(
        `Process is trying to save repeated translation key ${value.key} in context ${context.id} (${context.type}).`
      );
    }
    seen.add(value.key);
  });
}

function indexedValuesToList(indexedValues: Record<string, string>): TranslationValue[] {
  return Object.keys(indexedValues)
    .filter(key => indexedValues[key])
    .map(key => ({ key, value: indexedValues[key] }));
}

function processContextValues(context: TranslationContext | IndexedContext): TranslationContext {
  let values: TranslationValue[] = [];

  if (context.values && !Array.isArray(context.values)) {
    values = indexedValuesToList(context.values);
  } else if (Array.isArray(context.values)) {
    values = context.values as TranslationValue[];
  }

  checkDuplicateKeys(context, values);

  return { ...context, values };
}

function flattenTranslations(translation: TranslationType): TranslationEntryInput[] {
  if (!translation.contexts?.length || !translation.locale) {
    return [];
  }

  return translation.contexts.reduce<TranslationEntryInput[]>((flatTranslations, context) => {
    if (context.values) {
      context.values.forEach(contextValue => {
        flatTranslations.push({
          language: translation.locale as LanguageISO6391,
          key: contextValue.key!,
          value: contextValue.value!,
          context: { type: context.type!, label: context.label!, id: context.id! },
        });
      });
    }
    return flatTranslations;
  }, []);
}

class SaveLocaleTranslationsService {
  constructor(private deps: Deps) {}

  private async partitionByExistence(translations: TranslationEntryInput[]) {
    const byContext = new Map<string, TranslationEntryInput[]>();
    translations.forEach(t => {
      const list = byContext.get(t.context.id) || [];
      list.push(t);
      byContext.set(t.context.id, list);
    });

    const toCreate: TranslationEntryInput[] = [];
    const toUpdate: TranslationEntryInput[] = [];

    await Promise.all(
      [...byContext.entries()].map(async ([contextId, entries]) => {
        const keys = Array.from(new Set(entries.map(e => e.key)));
        const missingKeys = new Set(
          await this.deps.translationsDS.calculateNonexistentKeys(contextId, keys)
        );
        entries.forEach(entry => {
          if (missingKeys.has(entry.key)) {
            toCreate.push(entry);
          } else {
            toUpdate.push(entry);
          }
        });
      })
    );

    return { toCreate, toUpdate };
  }

  /**
   * Persist create/update entries. Must be called inside `transactionManager.run`
   * (or as a joinable UC transaction). Use cases join the ambient TX.
   */
  async persist(translation: TranslationType): Promise<void> {
    const entries = flattenTranslations(translation);
    if (!entries.length) {
      return;
    }

    const { toCreate, toUpdate } = await this.partitionByExistence(entries);

    if (toCreate.length) {
      await this.deps.createTranslationEntries.execute({ translations: toCreate });
    }
    if (toUpdate.length) {
      await this.deps.updateTranslationEntries.execute({ translations: toUpdate });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  prepare(translation: LocaleTranslationInput): TranslationType {
    if (!translation.locale) {
      throw new Error('translation to save should have a locale');
    }

    return {
      ...translation,
      contexts: translation.contexts && translation.contexts.map(processContextValues),
    };
  }

  async execute(translation: LocaleTranslationInput): Promise<TranslationType> {
    const translationToSave = this.prepare(translation);
    const [currentTranslationData] = await this.deps.query.getLegacy({
      locale: translationToSave.locale as LanguageISO6391,
    });

    await this.deps.transactionManager.run(async () => {
      await this.persist(translationToSave);
    });

    await this.deps.propagateThesaurusTranslation.forLocale(
      translationToSave,
      currentTranslationData?.contexts || []
    );

    return translationToSave;
  }
}

export { SaveLocaleTranslationsService };
export type { LocaleTranslationInput };
