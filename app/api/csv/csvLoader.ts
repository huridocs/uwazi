import translations from 'api/i18n';
import { WithId } from 'api/odm';
import settings from 'api/settings';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { EventEmitter } from 'events';
import { ObjectId } from 'mongodb';
import { TranslationType } from 'shared/translationType';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { arrangeThesauri } from './arrangeThesauri';
import csv, { CSVRow } from './csv';
import { extractEntity, toSafeName } from './entityRow';
import { importEntity, translateEntity } from './importEntity';
import importFile from './importFile';
import { thesauriFromStream } from './importThesauri';

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
    const template = await templates.getById(templateId);
    if (!template) {
      throw new Error('template not found!');
    }
    const { newNameGeneration = false, languages, dateFormat } = await settings.get();
    const availableLanguages: string[] = ensure<LanguageSchema[]>(languages).map(
      (language: LanguageSchema) => language.key
    );
    const file = importFile(csvPath);
    await arrangeThesauri(file, template, newNameGeneration, availableLanguages);

    await csv(await file.readStream(), this.stopOnError)
      .onRow(async (row: CSVRow) => {
        const { rawEntity, rawTranslations } = extractEntity(
          row,
          availableLanguages,
          options.language,
          newNameGeneration
        );
        if (rawEntity) {
          const entity = await importEntity(rawEntity, template, file, { ...options, dateFormat });
          await translateEntity(entity, rawTranslations, template, file);
          this.emit('entityLoaded', entity);
        }
      })
      .onError(async (e: Error, row: CSVRow, index: number) => {
        this._errors[index] = e;
        this.emit('loadError', e, toSafeName(row), index);
      })
      .read();

    this.throwErrors();
  }

  /* eslint-disable class-methods-use-this */
  async loadThesauri(
    csvPath: string,
    thesaurusId: ObjectIdSchema,
    { language }: { language: string }
  ) {
    const file = importFile(csvPath);
    const availableLanguages: string[] = ensure<LanguageSchema[]>((await settings.get()).languages)
      .map((l: LanguageSchema) => l.key)
      .filter((l: string) => l !== language);

    const fileStream = await file.readStream();
    const { thesauriValues: thesaurusValues, thesauriTranslations } = await thesauriFromStream(
      fileStream,
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
    const availableLanguages = ensure<LanguageSchema[]>((await settings.get()).languages).map(
      (l: LanguageSchema) => ({ label: l.label, language: l.key })
    );

    const intermediateTranslation: { [k: string]: { [k: string]: string } } = {};

    await csv(await file.readStream(), this.stopOnError)
      .onRow(async (row: CSVRow, _index: number): Promise<void> => {
        Object.keys(row).forEach(lang => {
          intermediateTranslation[lang] = intermediateTranslation[lang] || {};
          intermediateTranslation[lang][row.Key] = row[lang];
        });
      })
      .read();

    await availableLanguages.reduce(async (prev, lang) => {
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
    }, Promise.resolve({} as WithId<TranslationType>));

    return translations.get();
  }
}
