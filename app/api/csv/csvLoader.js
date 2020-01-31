/** @format */

import EventEmitter from 'events';

import templates from 'api/templates';
import settings from 'api/settings';
import translations from 'api/i18n';
import translationsModel from 'api/i18n/translationsModel';
import thesauri from 'api/thesauri';

import csv from './csv';
import importFile from './importFile';
import { importEntity, translateEntity } from './importEntity';
import { extractEntity, toSafeName } from './entityRow';

export default class CSVLoader extends EventEmitter {
  constructor(options = { stopOnError: true }) {
    super();
    this._errors = {};
    this.stopOnError = options.stopOnError;
  }

  errors() {
    return this._errors;
  }

  async load(csvPath, templateId, options = { language: 'en' }) {
    const template = await templates.getById(templateId);
    if (!template) {
      throw new Error('template not found!');
    }
    const file = importFile(csvPath);
    const availableLanguages = (await settings.get()).languages.map(l => l.key);

    await csv(await file.readStream(), this.stopOnError)
      .onRow(async row => {
        const { rawEntity, rawTranslations } = extractEntity(
          row,
          availableLanguages,
          options.language
        );

        const entity = await importEntity(rawEntity, template, file, options);
        if (rawTranslations.length) {
          await translateEntity(entity, rawTranslations, template, file);
        }
        this.emit('entityLoaded', entity);
      })
      .onError((e, row, index) => {
        this._errors[index] = e;
        this.emit('loadError', e, toSafeName(row), index);
      })
      .read();

    if (Object.keys(this._errors).length === 1) {
      const firstKey = Object.keys(this._errors)[0];
      throw this._errors[firstKey];
    }

    if (Object.keys(this._errors).length) {
      throw new Error('multiple errors ocurred !');
    }
  }

  /* eslint-disable class-methods-use-this */
  async loadThesauri(csvPath, thesaurusId, { language }) {
    const file = importFile(csvPath);
    const availableLanguages = (await settings.get()).languages
      .map(l => l.key)
      .filter(l => l !== language);
    const { thesauriValues: thesaurusValues, thesauriTranslations } = await csv(
      await file.readStream()
    ).toThesauri(language, availableLanguages);

    const thesaurus = await thesauri.getById(thesaurusId);
    const saved = await thesauri.save({
      ...thesaurus,
      values: [...thesaurus.values, ...thesaurusValues],
    });

    await Object.keys(thesauriTranslations).reduce(async (prev, lang) => {
      await prev;
      const translationValues = thesauriTranslations[lang];
      const [currentTranslation] = await translationsModel.get({ locale: lang });
      const currentContext = currentTranslation.contexts.find(
        c => c.id.toString() === thesaurusId.toString()
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
