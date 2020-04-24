import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import typeParsers from './typeParsers';
import { rawEntity } from 'api/csv/entityRow';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataSchema } from 'shared/types/commonTypes';
import { ImportFile } from 'api/csv/importFile';
import { EntitySchema } from 'shared/types/entityType';
import { ensure } from 'shared/tsUtils';

const toMetadata = async (template: TemplateSchema, toImportEntity: rawEntity) =>
  (template.properties || [])
    .filter(prop => (prop.name ? toImportEntity[prop.name] : false))
    .reduce<Promise<MetadataSchema>>(
      async (meta, prop) => ({
        ...(await meta),
        //prettier-ignore
        //@ts-ignore
        [prop.name || '']: typeParsers[prop.type]
          //@ts-ignore
          ? await typeParsers[prop.type](toImportEntity, prop)
          //@ts-ignore
          : await typeParsers.default(toImportEntity, prop)
        //prettier-ignore
      }),
      Promise.resolve({})
    );

const currentEntityIdentifiers = async (sharedId: string, language: string) =>
  sharedId ? entities.get({ sharedId, language }, '_id sharedId').then(([e]) => e) : {};

const entityObject = async (
  toImportEntity: rawEntity,
  template: TemplateSchema,
  { language }: Options
) => ({
  title: toImportEntity.title,
  template: template._id,
  metadata: await toMetadata(template, toImportEntity),
  ...(await currentEntityIdentifiers(toImportEntity.id, language)),
});

type Options = {
  user?: {};
  language: string;
};

const importEntity = async (
  toImportEntity: rawEntity,
  template: TemplateSchema,
  importFile: ImportFile,
  { user = {}, language }: Options
) => {
  const eo = await entityObject(toImportEntity, template, { language });
  const entity = await entities.save(eo, { user, language }, true, false);

  if (toImportEntity.file && entity.sharedId) {
    const file = await importFile.extractFile(toImportEntity.file);
    await processDocument(entity.sharedId, file);
  }

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  return entity;
};

const translateEntity = async (
  entity: EntitySchema,
  translations: rawEntity[],
  template: TemplateSchema,
  importFile: ImportFile
) => {
  await entitiesModel.saveMultiple(
    await Promise.all(
      translations.map(async translatedEntity =>
        entityObject({ ...translatedEntity, id: ensure(entity.sharedId) }, template, {
          language: translatedEntity.language,
        })
      )
    )
  );

  await Promise.all(
    translations.map(async translatedEntity => {
      if (translatedEntity.file) {
        const file = await importFile.extractFile(translatedEntity.file);
        await processDocument(ensure(entity.sharedId), file);
      }
    })
  );

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};

export { importEntity, translateEntity };
