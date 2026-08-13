import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationEntryInput } from './translation/ValidateTranslationsService.js';
import { TranslationsQueryService } from './translation/TranslationsQueryService.js';
import { TranslationsService } from './translation/TranslationsService.js';
import {
  ContextLike,
  LocaleTranslationLike,
  PropagateThesaurusTranslationService,
} from './translation/PropagateThesaurusTranslationService.js';
import { Translation } from '../domain/translation/Translation.js';

type Input = {
  translations: TranslationEntryInput[];
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
  query: TranslationsQueryService;
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

class SaveTranslationEntriesUseCase extends AbstractUseCase<Input, Output, Deps> {
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

  async execute({ translations }: Input): Promise<Output> {
    if (!translations.length) {
      return;
    }

    const { context } = translations[0];
    const previousSnapshots = await this.loadContextSnapshots(context.id);

    await this.transactionManager.run(async () => {
      await this.deps.translationsService.saveEntries(translations);
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

export { SaveTranslationEntriesUseCase };
export type { Input as SaveTranslationEntriesInput };
