/** @format */

import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import typeParsers from './typeParsers';

const toMetadata = async (template, entityToImport) =>
  template.properties
    .filter(prop => entityToImport[prop.name])
    .reduce(
      async (meta, prop) => ({
        ...(await meta),
        [prop.name]: typeParsers[prop.type]
          ? await typeParsers[prop.type](entityToImport, prop)
          : await typeParsers.default(entityToImport, prop),
      }),
      Promise.resolve({})
    );

const currentEntityIdentifiers = async (sharedId, language) =>
  sharedId ? entities.get({ sharedId, language }, '_id sharedId').then(([e]) => e) : {};

const entityObject = async (rawEntity, template, { language }) => ({
  title: rawEntity.title,
  template: template._id,
  metadata: await toMetadata(template, rawEntity),
  ...(await currentEntityIdentifiers(rawEntity.id, language)),
});

const importEntity = async (rawEntity, template, importFile, { user = {}, language }) => {
  const eo = await entityObject(rawEntity, template, { user, language });
  const entity = await entities.save(eo, { user, language }, true, false);

  if (rawEntity.file) {
    const file = await importFile.extractFile(rawEntity.file);
    await processDocument(entity.sharedId, file);
  }

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  return entity;
};

const translateEntity = async (entity, translations, template, importFile) => {
  await entitiesModel.saveMultiple(
    await Promise.all(
      translations.map(translatedEntity =>
        entityObject({ ...translatedEntity, id: entity.sharedId }, template, {
          language: translatedEntity.language,
        })
      )
    )
  );

  await Promise.all(
    translations.map(async translatedEntity => {
      if (translatedEntity.file) {
        const file = await importFile.extractFile(translatedEntity.file);
        await processDocument(entity.sharedId, file);
      }
    })
  );

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};

export { importEntity, translateEntity };
