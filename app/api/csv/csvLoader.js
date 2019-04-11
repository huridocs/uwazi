import csv from 'csvtojson';

import EventEmitter from 'events';
import entities from 'api/entities';
import templates, { templateUtils } from 'api/templates';
import PDF from 'api/upload/PDF';

import typeParsers from './typeParsers';
import ImportFile from './ImportFile';

import { uploadDocumentsPath } from '../config/paths';

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

const conversion = async (importFile, fileName) => ({
  uploaded: true,
  ...(await new PDF({
    destination: uploadDocumentsPath,
    originalname: fileName,
    filename: await importFile.extractFile(fileName)
  }).convert())
});

const importEntity = async (template, rawEntity, importFile, { user = {}, language }) => {
  const entity = await entities.save(
  {
    title: rawEntity.title,
    template: template._id,
    metadata: await toMetadata(template, rawEntity),
    ...(rawEntity.file ? await conversion(importFile, rawEntity.file) : {})
  },
    { user, language }
  );
  if (entity.file) {
    await new PDF({ ...entity.file, destination: uploadDocumentsPath })
    .createThumbnail(entity._id.toString());
  }
  return entity;
};

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

    const file = ImportFile(csvPath);
    const readStream = await file.readStream();

    await new Promise((resolve, reject) => {
      csv({
        delimiter: [',', ';']
      })
      .fromStream(readStream)
      .subscribe(async (rawEntity, index) => {
        try {
          const entity = await importEntity(template, toSafeName(rawEntity), file, options);
          this.emit('entityLoaded', entity);
        } catch (e) {
          if (this.stopOnError) {
            readStream.unpipe();
            readStream.destroy();
            throw e;
          }
          this._errors[index] = e;
          this.emit('loadError', e, toSafeName(rawEntity), index);
        }
      }, reject, resolve);
    });

    if (Object.keys(this._errors).length) {
      throw new Error('errors ocurred !');
    }
  }
}
