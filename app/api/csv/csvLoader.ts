import translations from '#api/i18n/index.js';
import settings from '#api/settings/index.js';
import thesauri from '#api/core/v1_layer/thesauri/index.js';
import { TranslationType } from '#shared/translationType.js';
import { ensure } from '#shared/tsUtils.js';
import { LanguageSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

import csv, { CSVRow, validateFormat, ValidateFormatOptions } from './csv.js';
import importFile from './importFile.js';
import { thesauriFromStream } from './importThesauri.js';

export class CSVLoader {
  stopOnError: boolean;

  constructor(options = { stopOnError: true }) {
    this.stopOnError = options.stopOnError;
  }

  /* eslint-disable class-methods-use-this */
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

    await translations.updateEntries(thesaurusId.toString(), thesauriTranslations);

    return saved;
  }
  /* eslint-enable class-methods-use-this */

  async loadTranslations(csvPath: string, translationContext: string) {
    const file = importFile(csvPath);

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

    await languagesToTranslate.reduce(
      async (prev, lang) => {
        await prev;
        const trans = intermediateTranslation[lang.label];

        const [dbTranslations] = await translations.get({ locale: lang.language });

        const context = (dbTranslations.contexts || []).find(
          (ctxt: any) => ctxt.id === translationContext
        );

        if (trans && context) {
          Object.keys(trans).forEach(transKey => {
            if (context.values[transKey] && trans[transKey] !== '') {
              context.values[transKey] = trans[transKey];
            }
          });
        }

        return translations.save(dbTranslations);
      },
      Promise.resolve({} as TranslationType)
    );

    return translations.get();
  }

  // eslint-disable-next-line class-methods-use-this
  async validateFormat(csvPath: string, options: ValidateFormatOptions) {
    await validateFormat(csvPath, options);
  }
}
