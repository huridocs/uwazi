import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { CreateTranslationEntriesUseCase } from '#api/core/application/CreateTranslationEntries.js';
import { UpdateTranslationEntriesUseCase } from '#api/core/application/UpdateTranslationEntries.js';
import { TranslationEntryInput } from '#api/core/application/translation/ValidateTranslationsService.js';
import { TranslationsQueryService } from '#api/core/application/translation/TranslationsQueryService.js';
import { PropagateThesaurusTranslationService } from '#api/core/application/translation/PropagateThesaurusTranslationService.js';

type Deps = {
  translationsDS: TranslationsDataSource;
  query: TranslationsQueryService;
  createTranslationEntries: CreateTranslationEntriesUseCase;
  updateTranslationEntries: UpdateTranslationEntriesUseCase;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

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

  private async upsert(translations: TranslationEntryInput[]) {
    if (!translations.length) {
      return;
    }

    const { toCreate, toUpdate } = await this.partitionByExistence(translations);

    if (toCreate.length) {
      await this.deps.createTranslationEntries.execute({ translations: toCreate });
    }
    if (toUpdate.length) {
      await this.deps.updateTranslationEntries.execute({ translations: toUpdate });
    }
  }

  async execute(translations: TranslationEntryInput[]): Promise<void> {
    if (!translations.length) {
      return;
    }

    const { context } = translations[0];
    const currentTranslations = await this.deps.query.getLegacy({ context: context.id });
    await this.upsert(translations);

    const thesaurusTranslations = currentTranslations[0]?.contexts?.[0]?.type === 'Thesaurus';
    if (!thesaurusTranslations) {
      return;
    }

    const updatedTranslations = await this.deps.query.getLegacy({ context: context.id });
    await Promise.all(
      updatedTranslations.map(async translation => {
        const originalContexts = currentTranslations.find(
          t => t.locale === translation.locale
        )?.contexts;
        return this.deps.propagateThesaurusTranslation.forContext(
          translation,
          (originalContexts || [context])[0]
        );
      })
    );
  }
}

export { SaveTranslationEntriesService };
