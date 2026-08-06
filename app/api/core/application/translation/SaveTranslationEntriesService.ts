import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import {
  ContextLike,
  LocaleTranslationLike,
  PropagateThesaurusTranslationService,
} from '#api/core/application/translation/PropagateThesaurusTranslationService.js';
import { Translation } from '#api/core/domain/translation/Translation.js';

type Deps = {
  transactionManager: TransactionManager;
  translationsDS: TranslationsDataSource;
  query: TranslationsQueryService;
  createTranslationEntries: CreateTranslationEntriesUseCase;
  updateTranslationEntries: UpdateTranslationEntriesUseCase;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type LocaleContextSnapshot = {
  locale: string;
  context: ContextLike;
};

const groupByLanguage = (translations: Translation[]): Map<string, Translation[]> => {
  const byLanguage = new Map<string, Translation[]>();
  translations.forEach(translation => {
    const list = byLanguage.get(translation.language) || [];
    list.push(translation);
    byLanguage.set(translation.language, list);
  });
  return byLanguage;
};

const toContextSnapshot = (
  contextId: string,
  contextMeta: Translation['context'],
  translations: Translation[]
): ContextLike => ({
  id: contextId,
  type: contextMeta.type,
  values: translations.map(translation => ({
    key: translation.key,
    value: translation.value,
  })),
});

class SaveTranslationEntriesService {
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

  private async loadContextSnapshots(contextId: string): Promise<LocaleContextSnapshot[]> {
    const translations = await this.deps.query.getByContext(contextId).all();
    if (!translations.length) {
      return [];
    }

    const byLanguage = groupByLanguage(translations);
    return [...byLanguage.entries()].map(([locale, languageTranslations]) => ({
      locale,
      context: toContextSnapshot(contextId, languageTranslations[0].context, languageTranslations),
    }));
  }

  async execute(translations: TranslationEntryInput[]): Promise<void> {
    if (!translations.length) {
      return;
    }

    const { context } = translations[0];
    const previousSnapshots = await this.loadContextSnapshots(context.id);

    await this.deps.transactionManager.run(async () => {
      const { toCreate, toUpdate } = await this.partitionByExistence(translations);

      if (toCreate.length) {
        await this.deps.createTranslationEntries.execute({ translations: toCreate });
      }
      if (toUpdate.length) {
        await this.deps.updateTranslationEntries.execute({ translations: toUpdate });
      }
    });

    const isThesaurus = previousSnapshots[0]?.context.type === 'Thesaurus';
    if (!isThesaurus) {
      return;
    }

    const updatedSnapshots = await this.loadContextSnapshots(context.id);
    await Promise.all(
      updatedSnapshots.map(async updated => {
        const previous =
          previousSnapshots.find(snapshot => snapshot.locale === updated.locale)?.context ||
          context;
        const localeTranslation: LocaleTranslationLike = {
          locale: updated.locale,
          contexts: [updated.context],
        };
        return this.deps.propagateThesaurusTranslation.forContext(localeTranslation, previous);
      })
    );
  }
}

export { SaveTranslationEntriesService };
