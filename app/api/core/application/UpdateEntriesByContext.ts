import { AbstractUseCase } from '../libs/UseCase.js';
import { SettingsDataSource } from './contracts/SettingsDataSource.js';
import { TranslationsQueryService } from './translation/TranslationsQueryService.js';
import { prepareLocaleTranslation } from './translation/localeTranslationDto.js';
import { TranslationsService } from './translation/TranslationsService.js';
import { PropagateThesaurusTranslationService } from './translation/PropagateThesaurusTranslationService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TranslationType } from '#shared/translationType.js';

type KeyValuePairsPerLanguage = {
  [language: string]: { [key: string]: string };
};

type Input = {
  contextId: string;
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage;
};

type Output = (TranslationType | void)[];

type Deps = {
  settingsDS: SettingsDataSource;
  query: TranslationsQueryService;
  translationsService: TranslationsService;
  propagateThesaurusTranslation: PropagateThesaurusTranslationService;
};

type PreparedLocaleUpdate = {
  previousContexts: NonNullable<TranslationType['contexts']>;
  next: TranslationType;
};

function checkForMissingKeys(
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage,
  locale: string,
  valueDict: Record<string, string>,
  contextId: string
) {
  const missingKeys = Object.keys(keyValuePairsPerLanguage[locale]).filter(
    key => !(key in valueDict)
  );
  if (missingKeys.length) {
    throw new Error(
      `Process is trying to update missing translation keys: ${locale} - ${contextId} - ${missingKeys}.`
    );
  }
}

function snapshotContexts(translation: TranslationType) {
  return (translation.contexts || []).map(context => ({
    ...context,
    values: [...(context.values || [])],
  }));
}

function valuesToDict(context: NonNullable<TranslationType['contexts']>[number]) {
  return Object.fromEntries((context.values || []).map(({ key, value }) => [key!, value!]));
}

function applyKeyValuePairs(
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage,
  locale: string,
  valueDict: Record<string, string>,
  contextId: string
) {
  checkForMissingKeys(keyValuePairsPerLanguage, locale, valueDict, contextId);
  const nextValues = {
    ...valueDict,
    ...keyValuePairsPerLanguage[locale],
  };
  return Object.entries(nextValues).map(([key, value]) => ({ key, value }));
}

function prepareLocaleUpdate(
  translation: TranslationType,
  contextId: string,
  keyValuePairsPerLanguage: KeyValuePairsPerLanguage
): PreparedLocaleUpdate | undefined {
  if (!translation.locale) {
    throw new Error('Translation local does not exist !');
  }

  const context = (translation.contexts || []).find(c => c.id === contextId);
  if (!context) {
    return undefined;
  }

  const previousContexts = snapshotContexts(translation);
  const valueDict = valuesToDict(context);
  context.values = applyKeyValuePairs(
    keyValuePairsPerLanguage,
    translation.locale,
    valueDict,
    contextId
  );

  return {
    previousContexts,
    next: prepareLocaleTranslation(translation),
  };
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
      languagesToUpdate.map(async language => {
        const [translation] = await this.deps.query.getLegacy({ locale: language });
        if (!translation) {
          throw new Error('Translation local does not exist !');
        }
        return prepareLocaleUpdate(translation, contextId, keyValuePairsPerLanguage);
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
      await prepared.reduce(async (previous, { next }) => {
        await previous;
        await this.deps.translationsService.persistLocale(next);
      }, Promise.resolve());
    });

    await Promise.all(
      prepared.map(async ({ next, previousContexts }) =>
        this.deps.propagateThesaurusTranslation.forLocale(next, previousContexts)
      )
    );

    return prepared.map(({ next }) => next);
  }
}

export { UpdateEntriesByContextUseCase };
export type { Input as UpdateEntriesByContextInput, KeyValuePairsPerLanguage };
