import EventEmitter from 'events';

import templates from 'api/templates';
import settings from 'api/settings';
import translations from 'api/i18n';
import translationsModel from 'api/i18n/translationsModel';
import thesauris from 'api/thesauris';

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
    const file = importFile(csvPath);
    const availableLanguages = (await settings.get()).languages.map(l => l.key);

    await csv(await file.readStream(), this.stopOnError)
    .onRow(async (row) => {
      const { rawEntity, rawTranslations } =
        extractEntity(row, availableLanguages, options.language);

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
      throw this._errors[0];
    }

    if (Object.keys(this._errors).length) {
      throw new Error('multiple errors ocurred !');
    }
  }

  async loadThesauri(csvPath, thesauriId, { language }) { //eslint-disable-line class-methods-use-this
    const file = importFile(csvPath);
    const availableLanguages = (await settings.get()).languages.map(l => l.key).filter(l => l !== language);
    const { thesauriValues, thesauriTranslations } = await csv(await file.readStream()).toThesauri(language, availableLanguages);

    const thesauri = await thesauris.getById(thesauriId);

    await thesauris.save({ ...thesauri, values: thesauriValues });

    await Object.keys(thesauriTranslations).reduce(async (prev, lang) => {
      await prev;
      const translationValues = thesauriTranslations[lang];
      const [currentTranslation] = (await translationsModel.get({ locale: lang }));
      const currentContext = currentTranslation.contexts.find(c => c.id.toString() === thesauriId.toString());

      return translations.save({
        ...currentTranslation,
        contexts: [
          {
            ...currentContext,
            values: translationValues,
          }
        ]
      });
    }, Promise.resolve());
  }
}
