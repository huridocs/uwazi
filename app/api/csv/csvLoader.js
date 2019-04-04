import csv from 'csvtojson';

import EventEmitter from 'events';
import entities from 'api/entities';
import fs from 'fs';
import templates, { templateUtils } from 'api/templates';

import typeParsers from './typeParsers';

const toSafeName = rawEntity =>
  Object.keys(rawEntity).reduce(
    (translatedObject, key) => ({
      ...translatedObject,
      [templateUtils.safeName(key)]: rawEntity[key]
    }),
    {}
  );

const toMetadata = async (template, entityToImport) =>
  template.properties
  .filter(prop => entityToImport[prop.name])
  .reduce(
    async (meta, prop) => ({
      ...(await meta),
      [prop.name]: typeParsers[prop.type] ?
        await typeParsers[prop.type](entityToImport, prop) :
        await typeParsers.default(entityToImport, prop)
    }),
    Promise.resolve({})
  );

const importEntity = async (template, rawEntity, { user = {}, language }) =>
  entities.save(
    {
      title: rawEntity.title,
      template: template._id,
      metadata: await toMetadata(template, rawEntity)
    },
    { user, language }
  );

export default class CSVLoader extends EventEmitter {
  constructor() {
    super();
    this._errors = {};
  }

  errors() {
    return this._errors;
  }

  async load(csvPath, templateId, options = { language: 'en' }) {
    const template = await templates.getById(templateId);

    await csv({
      delimiter: [',', ';']
    })
    .fromStream(fs.createReadStream(csvPath))
    .subscribe(async (rawEntity, index) => {
      try {
        const entity = await importEntity(template, toSafeName(rawEntity), options);
        this.emit('entityLoaded', entity);
      } catch (e) {
        this._errors[index] = e;
        this.emit('loadError', e, toSafeName(rawEntity), index);
      }
    });

    if (Object.keys(this._errors).length) {
      throw new Error('errors ocurred !');
    }
  }
}
