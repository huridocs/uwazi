import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { SaveLocaleTranslationsUseCaseFactory } from '#api/core/infrastructure/factories/SaveLocaleTranslationsUseCaseFactory.js';
import { UpdateEntriesByContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntriesByContextUseCaseFactory.js';
import { IndexedTranslations } from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import settings from '#api/settings/index.js';
import thesauri from '#api/core/v1_layer/thesauri/index.js';
import { ensure } from '#shared/tsUtils.js';
import { LanguageISO6391, LanguageSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

import csv, { CSVRow, validateFormat, ValidateFormatOptions } from './csv.js';
import importFile from './importFile.js';
import { thesauriFromStream } from './importThesauri.js';

export class CSVLoader {
  stopOnError: boolean;

  constructor(options = { stopOnError: true }) {
    this.stopOnError = options.stopOnError;
  }

  /* eslint-disable class-methods-use-this, max-statements */
  async loadThesauri(
    csvPath: string,
    thesaurusId: ObjectIdSchema,
    { language }: { language: string }
  ) {
    const file = importFile(csvPath);
    const settingsData = await settings.get();
    const defaultLanguage = settingsData.languages?.find(l => l.default)?.key;

    const languageToUse = defaultLanguage || language;

    const availableLanguages: string[] = ensure<LanguageSchema[]>(settingsData.languages)
      .map((l: LanguageSchema) => l.key)
      .filter((l: string) => l !== languageToUse);

    const fileStream = await file.readStream();
    const { thesauriValues: thesaurusValues, thesauriTranslations } = await thesauriFromStream(
      fileStream,
      languageToUse,
      language,
      availableLanguages
    );

    const currentThesauri = (await thesauri.getById(thesaurusId)) || ({} as ThesaurusSchema);
    const theaurusToSave = thesauri.appendValues(currentThesauri, thesaurusValues);
    const saved = await thesauri.save(theaurusToSave);

    await UpdateEntriesByContextUseCaseFactory.default().execute({
      contextId: thesaurusId.toString(),
      keyValuePairsPerLanguage: thesauriTranslations,
    });

    return saved;
  }
  /* eslint-enable class-methods-use-this, max-statements */

  async loadTranslations(
    csvPath: string,
    translationContext: string
  ): Promise<IndexedTranslations[]> {
    const file = importFile(csvPath);
    const query = TranslationsQueryServiceFactory.default();

    const intermediateTranslation: { [k: string]: { [k: string]: string } } = {};

    await csv(await file.readStream(), this.stopOnError)
      .onRow(async (row: CSVRow, _index: number): Promise<void> => {
        Object.keys(row).forEach(lang => {
          intermediateTranslation[lang] = intermediateTranslation[lang] || {};
          intermediateTranslation[lang][row.Key] = row[lang];
        });
      })
      .read();

    const languagesToTranslate = ensure<LanguageSchema[]>((await settings.get()).languages)
      .map((l: LanguageSchema) => ({ label: l.label, language: l.key }))
      .filter(lang => Object.keys(intermediateTranslation).includes(lang.label));

    // eslint-disable-next-line max-statements
    await languagesToTranslate.reduce(async (prev, lang) => {
      await prev;
      const trans = intermediateTranslation[lang.label];
      if (!trans) {
        return;
      }

      const locale = lang.language as LanguageISO6391;
      const rows = await query.getByLanguageAndContext(locale, translationContext).all();
      if (!rows.length) {
        return;
      }

      const previous: Record<string, string> = {};
      rows.forEach(row => {
        previous[row.key] = row.value;
      });

      const patched: Record<string, string> = {};
      Object.keys(trans).forEach(transKey => {
        if (previous[transKey] && trans[transKey] !== '') {
          patched[transKey] = trans[transKey];
        }
      });

      if (!Object.keys(patched).length) {
        return;
      }

      const { context } = rows[0];
      await SaveLocaleTranslationsUseCaseFactory.default().execute({
        locale,
        contexts: [
          {
            id: context.id,
            type: context.type,
            label: context.label,
            values: patched,
          },
        ],
      });
    }, Promise.resolve());

    return query.getLegacy();
  }

  // eslint-disable-next-line class-methods-use-this
  async validateFormat(csvPath: string, options: ValidateFormatOptions) {
    await validateFormat(csvPath, options);
  }
}
