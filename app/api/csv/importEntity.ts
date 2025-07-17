/* eslint-disable max-statements */
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import entities from 'api/entities';
import { search } from 'api/search';
import { processDocument } from 'api/files/processDocument';
import { RawEntity } from 'api/csv/entityRow';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataObjectSchema, MetadataSchema, PropertySchema } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';
import { ImportFile } from 'api/csv/importFile';
import { EntitySchema } from 'shared/types/entityType';
import { ensure } from 'shared/tsUtils';
import { files, generateFileName, storage } from 'api/files';
import { generateID } from 'shared/IDGenerator';

import typeParsers from './typeParsers';
import { csvConstants } from './csvDefinitions';

const parse = async (toImportEntity: RawEntity, prop: PropertySchema, dateFormat: string) => {
  const parser = typeParsers[prop.type] || typeParsers.text;
  const result = await parser(toImportEntity, prop, dateFormat);

  if (Array.isArray(result)) {
    return { data: result, warnings: [] };
  }

  return result;
};

const hasValidValue = (prop: PropertySchema, toImportEntity: RawEntity) =>
  prop.name
    ? toImportEntity.propertiesFromColumns[prop.name] || prop.type === propertyTypes.generatedid
    : false;

const toMetadata = async (
  template: TemplateSchema,
  toImportEntity: RawEntity,
  dateFormat: string,
  feedbackCallback?: (warning: { property: string; value: string; reason: string }) => void
): Promise<MetadataSchema> => {
  const metadata: MetadataSchema = {};

  const propertyPromises = (template.properties || [])
    .filter(prop => hasValidValue(prop, toImportEntity))
    .map(async prop => {
      const propName = ensure<string>(prop.name);
      const originalValue = toImportEntity.propertiesFromColumns[propName];

      const parsed = await parse(toImportEntity, prop, dateFormat);

      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        const { data, warnings } = parsed;

        warnings.forEach(warning => {
          if (feedbackCallback) {
            feedbackCallback(warning);
          }
        });

        if (data && data.length > 0) {
          metadata[propName] = data;
        } else if (feedbackCallback) {
          feedbackCallback({
            property: propName,
            value: originalValue,
            reason: 'Sanitized entries skipped in import',
          });
        }
      } else if (parsed === null || parsed === undefined) {
        if (feedbackCallback) {
          feedbackCallback({
            property: propName,
            value: originalValue,
            reason: 'Sanitized entries skipped in import',
          });
        }
      } else {
        const data = parsed as MetadataObjectSchema[];
        if (Array.isArray(data) && data.length === 0) {
          if (feedbackCallback) {
            feedbackCallback({
              property: propName,
              value: originalValue,
              reason: 'Sanitized entries skipped in import',
            });
          }
        } else {
          metadata[propName] = data || [];
        }
      }
    });

  await Promise.all(propertyPromises);

  return metadata;
};

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
  {
    language,
    dateFormat = 'YYYY/MM/DD',
    feedbackCallback,
  }: Options & {
    feedbackCallback?: (warning: { property: string; value: string; reason: string }) => void;
  }
) => ({
  language,
  title: titleByTemplate(template, toImportEntity),
  template: template._id,
  metadata: await toMetadata(template, toImportEntity, dateFormat, feedbackCallback),
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
  {
    user = {},
    language,
    dateFormat,
    feedbackCallback,
  }: Options & {
    feedbackCallback?: (warning: { property: string; value: string; reason: string }) => void;
  }
) => {
  const { propertiesFromColumns } = toImportEntity;
  const { attachments } = propertiesFromColumns;

  let parsedAttachments: { filename: string; originalname: string }[] | undefined;
  if (attachments) {
    parsedAttachments = attachments?.split(csvConstants.multiValueSeparator)?.map(attachment => ({
      filename: generateFileName({ originalname: attachment }),
      originalname: attachment,
    }));
  }

  delete propertiesFromColumns.attachments;

  const eo = await entityObject(toImportEntity, template, {
    language,
    dateFormat,
    feedbackCallback,
  });

  if (parsedAttachments?.length) {
    Object.entries(eo.metadata as [string, any[]]).forEach(([key, metadata]) => {
      const attachment = parsedAttachments.find(pA => pA.originalname === metadata[0].value);

      if (attachment) {
        eo.metadata[key] = [{ value: `/api/files/${attachment.filename}` }];
      }
    });
  }

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

  if (parsedAttachments?.length && entity.sharedId) {
    await parsedAttachments.reduce(async (promise: Promise<any>, attachment) => {
      await promise;

      const attachmentFile = await importFile.extractFile(
        attachment.originalname,
        attachment.filename
      );
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

const lookupLabel = (
  label: string | undefined,
  translations: FullyIndexedTranslations,
  language: string,
  propNameToThesauriId: Record<string, string>,
  key: string
) => (label ? translations[language]?.[propNameToThesauriId[key]]?.[label] || label : label);

const translateSelectLabel = (
  value: MetadataObjectSchema,
  translations: FullyIndexedTranslations,
  language: string,
  propNameToThesauriId: Record<string, string>,
  key: string
) => {
  const rootValue = {
    value: value.value,
    label: lookupLabel(value.label, translations, language, propNameToThesauriId, key),
  };
  const parentValue = value.parent
    ? {
        value: value.parent.value,
        label: lookupLabel(value.parent.label, translations, language, propNameToThesauriId, key),
      }
    : undefined;
  return parentValue ? { ...rootValue, parent: parentValue } : rootValue;
};

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
          (values || []).map(value =>
            translateSelectLabel(value, translations, language, propNameToThesauriId, key)
          ),
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
  indexedTranslations: FullyIndexedTranslations,
  dateFormat?: string
) => {
  await translations.reduce(async (prevPromise, translation) => {
    await prevPromise;

    const entityParsed = await entityObject(
      {
        ...translation,
        propertiesFromColumns: {
          ...translation.propertiesFromColumns,
          id: ensure(entity.sharedId),
        },
      },
      template,
      {
        language: translation.language,
        dateFormat,
      }
    );

    const toSave = translateSelectLabels(
      entityParsed,
      translation.language,
      indexedTranslations,
      propNameToThesauriId
    );

    await entities.save(toSave, { language: translation.language, user: {} });
  }, Promise.resolve());

  await Promise.all(
    translations.map(async translatedEntity => {
      if (translatedEntity.propertiesFromColumns.file) {
        const file = await importFile.extractFile(translatedEntity.propertiesFromColumns.file);
        await processDocument(ensure(entity.sharedId), file);
        await storage.storeFile(file.filename, createReadStream(file.path), 'document');
      }
    })
  );

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};

export { importEntity, translateEntity };
export type { FullyIndexedTranslations };
