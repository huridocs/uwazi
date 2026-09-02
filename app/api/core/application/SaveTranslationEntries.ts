import { AbstractUseCase } from '../libs/UseCase.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { toValueMap } from './translation/localeTranslationDto.js';
import { Translation } from '../domain/translation/Translation.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';

type Input = {
  translations: Translation[];
};

type Output = void;

type Deps = {
  translationsService: TranslationsService;
  translationsDS: TranslationsDataSource;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type LocaleValueSnapshot = {
  locale: string;
  type: string;
  values: Record<string, string>;
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

class SaveTranslationEntriesUseCase extends AbstractUseCase<Input, Output, Deps> {
  private async loadContextSnapshots(contextId: string): Promise<LocaleValueSnapshot[]> {
    const translations = await this.deps.translationsDS.getByContext(contextId);
    if (!translations.length) {
      return [];
    }

    return [...groupByLanguage(translations).entries()].map(([locale, languageTranslations]) => ({
      locale,
      type: languageTranslations[0].context.type,
      values: toValueMap(languageTranslations),
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

    if (previousSnapshots[0]?.type !== 'Thesaurus') {
      return;
    }

    const incomingByLocale: Record<string, Record<string, string>> = {};
    translations.forEach(entry => {
      incomingByLocale[entry.language] = incomingByLocale[entry.language] || {};
      incomingByLocale[entry.language][entry.key] = entry.value;
    });

    await Promise.all(
      previousSnapshots.map(async snapshot =>
        this.deps.propagateThesaurusTranslation.propagate({
          locale: snapshot.locale,
          contextId: context.id,
          type: snapshot.type,
          previous: snapshot.values,
          next: { ...snapshot.values, ...(incomingByLocale[snapshot.locale] || {}) },
        })
      )
    );
  }
}

export { SaveTranslationEntriesUseCase };
export type { Input as SaveTranslationEntriesInput };
