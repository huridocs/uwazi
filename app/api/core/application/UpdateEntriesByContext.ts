import { AbstractUseCase } from '../libs/UseCase.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TranslationsDataSource } from './contracts/TranslationsDataSource.js';
import { toValueMap } from './translation/localeTranslationDto.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { TranslationEntryInput } from './translation/ValidateTranslationsService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type KeyValuePairsPerLanguage = {
  [language: string]: { [key: string]: string };
};

type Input = {
  contextId: string;
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage;
};

type Output = LanguageISO6391[];

type Deps = {
  settingsDS: SettingsDataSource;
  translationsDS: TranslationsDataSource;
  translationsService: TranslationsService;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type PreparedLocaleUpdate = {
  locale: LanguageISO6391;
  type: string;
  previous: Record<string, string>;
  next: Record<string, string>;
  entries: TranslationEntryInput[];
};

function checkForMissingKeys(
  incoming: Record<string, string>,
  existing: Record<string, string>,
  locale: string,
  contextId: string
) {
  const missingKeys = Object.keys(incoming).filter(key => !(key in existing));
  if (missingKeys.length) {
    throw new Error(
      `Process is trying to update missing translation keys: ${locale} - ${contextId} - ${missingKeys}.`
    );
  }
}

class UpdateEntriesByContextUseCase extends AbstractUseCase<Input, Output, Deps> {
  private async prepareUpdates(
    contextId: string,
    keyValuePairsPerLanguage: KeyValuePairsPerLanguage
  ): Promise<PreparedLocaleUpdate[]> {
    const languageKeys = await this.deps.settingsDS.getLanguageKeys();
    const languagesSet = new Set(languageKeys.map(String));

    const languagesToUpdate = Object.keys(keyValuePairsPerLanguage).filter(l =>
      languagesSet.has(l)
    ) as LanguageISO6391[];

    const results = await Promise.allSettled(
      languagesToUpdate.map(async locale => {
        const rows = await this.deps.translationsDS
          .getByLanguageAndContext(locale, contextId)
          .all();
        if (!rows.length) {
          return undefined;
        }

        const incoming = keyValuePairsPerLanguage[locale];
        const previous = toValueMap(rows);
        checkForMissingKeys(incoming, previous, locale, contextId);

        const { context } = rows[0];
        const next = { ...previous, ...incoming };
        const entries: TranslationEntryInput[] = Object.entries(next).map(([key, value]) => ({
          language: locale,
          key,
          value,
          context,
        }));

        return {
          locale,
          type: context.type,
          previous,
          next,
          entries,
        };
      })
    );

    const firstFailure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    );
    if (firstFailure) {
      throw firstFailure.reason;
    }

    return results
      .map(result => (result as PromiseFulfilledResult<PreparedLocaleUpdate | undefined>).value)
      .filter((item): item is PreparedLocaleUpdate => Boolean(item));
  }

  async execute({ contextId, keyValuePairsPerLanguage }: Input): Promise<Output> {
    const prepared = await this.prepareUpdates(contextId, keyValuePairsPerLanguage);

    await this.transactionManager.run(async () => {
      await this.deps.translationsService.saveEntries(prepared.flatMap(item => item.entries));
    });

    await Promise.all(
      prepared.map(async item =>
        this.deps.propagateThesaurusTranslation.propagate({
          locale: item.locale,
          contextId,
          type: item.type,
          previous: item.previous,
          next: item.next,
        })
      )
    );

    return prepared.map(item => item.locale);
  }
}

export { UpdateEntriesByContextUseCase };
export type { Input as UpdateEntriesByContextInput, KeyValuePairsPerLanguage };
