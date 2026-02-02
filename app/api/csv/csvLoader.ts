import { ObjectId } from 'mongodb';
import groupBy from 'lodash/groupBy.js';

import translations from '../i18n/index.js';
import { EnforcedWithId } from '#api/odm/index.js';
import settings from '#api/settings/index.js';
import templates from '#api/core/v1_layer/templates/index.js';
import thesauri from '#api/thesauri/index.js';
import { EventEmitter } from 'events';

import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { TranslationType } from '#shared/translationType.js';
import { ensure } from '#shared/tsUtils.js';
import { LanguageSchema, ObjectIdSchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

import { arrangeThesauri } from './arrangeThesauri.js';
import csv, { CSVRow, validateFormat, ValidateFormatOptions } from './csv.js';
import { extractEntity, toSafeName } from './entityRow.js';
import { FullyIndexedTranslations, importEntity, translateEntity } from './importEntity.js';
import importFile from './importFile.js';
import { thesauriFromStream } from './importThesauri.js';
import { validateColumns } from './validateColumns.js';

const readResources = async (
  templateId: ObjectId | string
): Promise<{
  template: EnforcedWithId<TemplateSchema>;
  newNameGeneration: boolean;
  availableLanguages: string[];
  defaultLanguage: string;
  dateFormat: string | undefined;
}> => {
  const template = await templates.getById(templateId);
  if (!template) {
    throw new Error('template not found!');
  }
  const { newNameGeneration = false, languages, dateFormat } = await settings.get();
  const availableLanguages: string[] = ensure<LanguageSchema[]>(languages).map(
    (language: LanguageSchema) => language.key
  );
  const defaultLanguage = languages?.find((l: LanguageSchema) => l.default)?.key;
  if (!defaultLanguage) throw new Error('default language not found!');

  return {
    template,
    newNameGeneration,
    availableLanguages,
    defaultLanguage,
    dateFormat,
  };
};

const getTranslations = async (): Promise<FullyIndexedTranslations> =>
  objectIndex(
    await translations.get({}),
    tr => tr.locale || '',
    tr =>
      objectIndex(
        tr.contexts || [],
        c => c.id || '',
        c => c.values
      )
  );

export class CSVLoader extends EventEmitter {
  stopOnError: boolean;

  _errors: { [k: number]: Error };

  constructor(options = { stopOnError: true }) {
    super();
    this._errors = {};
    this.stopOnError = options.stopOnError;
  }

  errors() {
    return this._errors;
  }

  throwErrors() {
    if (Object.keys(this._errors).length === 1) {
      const firstKey = Object.keys(this._errors)[0];
      throw this._errors[Number(firstKey)];
    }

    if (Object.keys(this._errors).length) {
      throw new Error('multiple errors ocurred !');
    }
  }

  async load(
    csvPath: string,
    templateId: ObjectId | string,
    options = { language: 'en', user: {} }
  ) {
    const { template, newNameGeneration, availableLanguages, defaultLanguage, dateFormat } =
      await readResources(templateId);
    const file = importFile(csvPath);
    const { headersWithoutLanguage, languagesPerHeader } = await validateColumns(
      file,
      template,
      availableLanguages,
      defaultLanguage,
      newNameGeneration
    );
    const propNameToThesauriId = await arrangeThesauri(
      file,
      template,
      newNameGeneration,
      headersWithoutLanguage,
      languagesPerHeader,
      defaultLanguage
    );
    const indexedTranslations = await getTranslations();

    const warnings: Array<{ property: string; value: string; reason: string; index: number }> = [];
    const feedbackCallback = (
      warning: { property: string; value: string; reason: string },
      index: number
    ) => {
      warnings.push({ ...warning, index });
    };
    await csv(await file.readStream(), this.stopOnError)
      .onRow(async (row: CSVRow, index: number) => {
        const { rawEntity, rawTranslations } = extractEntity(
          row,
          availableLanguages,
          options.language,
          defaultLanguage,
          propNameToThesauriId,
          newNameGeneration
        );
        if (rawEntity) {
          const entity = await importEntity(rawEntity, template, file, {
            ...options,
            dateFormat,
            feedbackCallback: error => feedbackCallback(error, index),
          });

          await translateEntity(
            entity,
            rawTranslations,
            template,
            file,
            propNameToThesauriId,
            indexedTranslations,
            dateFormat
          );
          this.emit('entityLoaded', entity);
        }
      })
      .onError(async (e: Error, row: CSVRow, index: number) => {
        this._errors[index] = e;
        this.emit('loadError', e, toSafeName(row), index);
      })
      .read();

    if (warnings.length > 0) {
      const groupedWarnings = groupBy(warnings, warning => warning.reason);
      Object.keys(groupedWarnings).forEach(key => {
        groupedWarnings[key] = groupedWarnings[key].map(warning => ({
          index: warning.index,
          property: warning.property,
          value: warning.value,
          reason: '',
        }));
      });
      this.emit('rowExceptions', groupedWarnings);
    }

    this.throwErrors();
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
