import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import { processAttachmentAllLanguages } from 'api/attachments/routes';
import { RawEntity } from 'api/csv/entityRow';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataSchema, PropertySchema } from 'shared/types/commonTypes';
import { ImportFile } from 'api/csv/importFile';
import { EntitySchema } from 'shared/types/entityType';
import { ensure } from 'shared/tsUtils';

import typeParsers from './typeParsers';
import { attachmentsPath } from 'api/files';

const parse = async (toImportEntity: RawEntity, prop: PropertySchema) =>
  typeParsers[prop.type]
    ? typeParsers[prop.type](toImportEntity, prop)
    : typeParsers.text(toImportEntity, prop);

const toMetadata = async (
  template: TemplateSchema,
  toImportEntity: RawEntity
): Promise<MetadataSchema> =>
  (template.properties || [])
    .filter(prop => (prop.name ? toImportEntity[prop.name] : false))
    .reduce<Promise<MetadataSchema>>(
      async (meta, prop) =>
        ({
          ...(await meta),
          [ensure<string>(prop.name)]: await parse(toImportEntity, prop),
        } as MetadataSchema),
      Promise.resolve({})
    );

const currentEntityIdentifiers = async (sharedId: string, language: string) =>
  sharedId ? entities.get({ sharedId, language }, '_id sharedId').then(([e]) => e) : {};

const entityObject = async (
  toImportEntity: RawEntity,
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
  toImportEntity: RawEntity,
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

  if (toImportEntity.attachments && entity.sharedId) {
    await toImportEntity.attachments.split('|').reduce(async (promise, attachment) => {
      await promise;
      await processAttachmentAllLanguages(
        entity,
        await importFile.extractFile(attachment, attachmentsPath())
      );
    }, Promise.resolve());
  }

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  return entity;
};

const translateEntity = async (
  entity: EntitySchema,
  translations: RawEntity[],
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
