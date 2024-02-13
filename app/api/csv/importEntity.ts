// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import { RawEntity } from 'api/csv/entityRow';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataSchema, PropertySchema } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';
import { ImportFile } from 'api/csv/importFile';
import { EntitySchema } from 'shared/types/entityType';
import { ensure } from 'shared/tsUtils';
import { files, storage } from 'api/files';
import { generateID } from 'shared/IDGenerator';

import typeParsers from './typeParsers';
import { csvConstants } from './csvDefinitions';

const parse = async (toImportEntity: RawEntity, prop: PropertySchema, dateFormat: string) =>
  typeParsers[prop.type]
    ? typeParsers[prop.type](toImportEntity, prop, dateFormat)
    : typeParsers.text(toImportEntity, prop);

const hasValidValue = (prop: PropertySchema, toImportEntity: RawEntity) =>
  prop.name
    ? toImportEntity.propertiesFromColumns[prop.name] || prop.type === propertyTypes.generatedid
    : false;

const toMetadata = async (
  template: TemplateSchema,
  toImportEntity: RawEntity,
  dateFormat: string
): Promise<MetadataSchema> =>
  (template.properties || [])
    .filter(prop => hasValidValue(prop, toImportEntity))
    .reduce<Promise<MetadataSchema>>(
      async (meta, prop) =>
        ({
          ...(await meta),
          [ensure<string>(prop.name)]: await parse(toImportEntity, prop, dateFormat),
        }) as MetadataSchema,
      Promise.resolve({})
    );

const currentEntityIdentifiers = async (sharedId: string | undefined, language: string) =>
  sharedId ? entities.get({ sharedId, language }, '_id sharedId').then(([e]) => e) : {};

const titleByTemplate = (template: TemplateSchema, entity: RawEntity) => {
  const { propertiesFromColumns: data } = entity;
  const generatedTitle =
    !data.title &&
    template.commonProperties?.find(property => property.name === 'title' && property.generatedId);
  if (generatedTitle) {
    return generateID(3, 4, 4);
  }
  return data.title;
};

const entityObject = async (
  toImportEntity: RawEntity,
  template: TemplateSchema,
  { language, dateFormat = 'YYYY/MM/DD' }: Options
) => ({
  title: titleByTemplate(template, toImportEntity),
  template: template._id,
  metadata: await toMetadata(template, toImportEntity, dateFormat),
  ...(await currentEntityIdentifiers(toImportEntity.propertiesFromColumns.id, language)),
});

type Options = {
  user?: {};
  language: string;
  dateFormat?: string;
};

const importEntity = async (
  toImportEntity: RawEntity,
  template: TemplateSchema,
  importFile: ImportFile,
  { user = {}, language, dateFormat }: Options
) => {
  const { propertiesFromColumns } = toImportEntity;
  const { attachments } = propertiesFromColumns;
  delete propertiesFromColumns.attachments;
  const eo = await entityObject(toImportEntity, template, { language, dateFormat });
  const entity = await entities.save(
    eo,
    { user, language },
    { updateRelationships: true, index: false }
  );

  if (propertiesFromColumns.file && entity.sharedId) {
    const file = await importFile.extractFile(propertiesFromColumns.file);
    await processDocument(entity.sharedId, file);
    await storage.storeFile(file.filename, createReadStream(file.path), 'document');
  }

  if (attachments && entity.sharedId) {
    await attachments
      .split(csvConstants.multiValueSeparator)
      .reduce(async (promise: Promise<any>, attachment) => {
        await promise;
        const attachmentFile = await importFile.extractFile(attachment);
        await storage.storeFile(
          attachmentFile.filename,
          createReadStream(attachmentFile.path),
          'attachment'
        );
        return files.save({ ...attachmentFile, entity: entity.sharedId, type: 'attachment' });
      }, Promise.resolve());
  }

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
  return entity;
};

type FullyIndexedTranslations = Record<string, Record<string, Record<string, string>>>;

const translateSelectLabels = (
  entity: EntitySchema,
  language: string,
  translations: FullyIndexedTranslations,
  propNameToThesauriId: Record<string, string>
) => {
  const translatedMetadata = Object.fromEntries(
    Object.entries(entity.metadata || {}).map(([key, values]) => {
      if (key in propNameToThesauriId) {
        return [
          key,
          (values || []).map(({ value, label }) => ({
            value,
            label: label
              ? translations[language]?.[propNameToThesauriId[key]]?.[label] || label
              : label,
          })),
        ];
      }
      return [key, values];
    })
  );
  const translatedEntity = { ...entity, metadata: translatedMetadata };
  return translatedEntity;
};

const translateEntity = async (
  entity: EntitySchema,
  translations: RawEntity[],
  template: TemplateSchema,
  importFile: ImportFile,
  propNameToThesauriId: Record<string, string>,
  indexedTranslations: FullyIndexedTranslations
) => {
  await entitiesModel.saveMultiple(
    await Promise.all(
      translations.map(async translatedEntity => {
        const translatedEntityObject = await entityObject(
          {
            ...translatedEntity,
            propertiesFromColumns: {
              ...translatedEntity.propertiesFromColumns,
              id: ensure(entity.sharedId),
            },
          },
          template,
          {
            language: translatedEntity.language,
          }
        );

        return translateSelectLabels(
          translatedEntityObject,
          translatedEntity.language,
          indexedTranslations,
          propNameToThesauriId
        );
      })
    )
  );

  await Promise.all(
    translations.map(async translatedEntity => {
      if (translatedEntity.propertiesFromColumns.file) {
        const file = await importFile.extractFile(translatedEntity.propertiesFromColumns.file);
        await processDocument(ensure(entity.sharedId), file);
      }
    })
  );

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};

export { importEntity, translateEntity };
export type { FullyIndexedTranslations };
