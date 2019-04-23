import EventEmitter from 'events';

import templates from 'api/templates';
import settings from 'api/settings';

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
}
