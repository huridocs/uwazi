import { EventEmitter } from 'events';

import templates from 'api/templates';
import settings from 'api/settings';
import translations from 'api/i18n';
import translationsModel from 'api/i18n/translationsModel';
import thesauri from 'api/thesauri';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

import csv, { CSVRow } from './csv';
import importFile from './importFile';
import { importEntity, translateEntity } from './importEntity';
import { extractEntity, toSafeName } from './entityRow';
import { ensure } from 'shared/tsUtils';

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

  async load(csvPath: string, templateId: string, options = { language: 'en' }) {
    const template = await templates.getById(templateId);
    if (!template) {
      throw new Error('template not found!');
    }
    const file = importFile(csvPath);
    const availableLanguages: string[] = ensure<LanguageSchema[]>(
      (await settings.get()).languages
    ).map((l: LanguageSchema) => l.key);

    await csv(await file.readStream(), this.stopOnError)
      .onRow(async (row: CSVRow) => {
        const { rawEntity, rawTranslations } = extractEntity(
          row,
          availableLanguages,
          options.language
        );

        if (rawEntity) {
          const entity = await importEntity(rawEntity, template, file, options);
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
  async loadThesauri(csvPath: string, thesaurusId: string, { language }: { language: string }) {
    const file = importFile(csvPath);
    const availableLanguages: string[] = ensure<LanguageSchema[]>((await settings.get()).languages)
      .map((l: LanguageSchema) => l.key)
      .filter((l: string) => l !== language);

    const { thesauriValues: thesaurusValues, thesauriTranslations } = await csv(
      await file.readStream()
    ).toThesauri(language, availableLanguages);

    const currentThesauri = (await thesauri.getById(thesaurusId)) || ({} as ThesaurusSchema);
    const thesauriValues = currentThesauri.values || [];

    const saved = await thesauri.save({
      ...currentThesauri,
      values: [...thesauriValues, ...thesaurusValues],
    });

    await Object.keys(thesauriTranslations).reduce(async (prev, lang) => {
      await prev;
      const translationValues = thesauriTranslations[lang];
      const [currentTranslation] = await translationsModel.get({ locale: lang });
      const currentContext = currentTranslation.contexts.find(
        (c: { id: string }) => c.id.toString() === thesaurusId.toString()
      );

      return translations.save({
        ...currentTranslation,
        contexts: [
          {
            ...currentContext,
            values: [...currentContext.values, ...translationValues],
          },
        ],
      });
    }, Promise.resolve());
    return saved;
  }
  /* eslint-enable class-methods-use-this */
}
