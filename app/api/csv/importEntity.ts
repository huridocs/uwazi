/* eslint-disable max-statements */
import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import { RawEntity, toSafeName } from 'api/csv/entityRow';
import { TemplateSchema } from 'shared/types/templateType';
import { MetadataSchema, PropertySchema } from 'shared/types/commonTypes';
import { propertyTypes } from 'shared/propertyTypes';
import { ImportFile } from 'api/csv/importFile';
import thesauri from 'api/thesauri';
import { EntitySchema } from 'shared/types/entityType';
import { ensure } from 'shared/tsUtils';
import { attachmentsPath, files } from 'api/files';
import { generateID } from 'shared/IDGenerator';

import { normalizeThesaurusLabel } from './typeParsers/select';
import { splitMultiselectLabels } from './typeParsers/multiselect';
import typeParsers from './typeParsers';
import csv, { CSVRow } from './csv';

const parse = async (toImportEntity: RawEntity, prop: PropertySchema) =>
  typeParsers[prop.type]
    ? typeParsers[prop.type](toImportEntity, prop)
    : typeParsers.text(toImportEntity, prop);

const hasValidValue = (prop: PropertySchema, toImportEntity: RawEntity) =>
  prop.name ? toImportEntity[prop.name] || prop.type === propertyTypes.generatedid : false;

const toMetadata = async (
  template: TemplateSchema,
  toImportEntity: RawEntity
): Promise<MetadataSchema> =>
  (template.properties || [])
    .filter(prop => hasValidValue(prop, toImportEntity))
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

const titleByTemplate = (template: TemplateSchema, entity: RawEntity) => {
  const generatedTitle =
    !entity.title &&
    template.commonProperties?.find(property => property.name === 'title' && property.generatedId);
  if (generatedTitle) {
    return generateID(3, 4, 4);
  }
  return entity.title;
};

const entityObject = async (
  toImportEntity: RawEntity,
  template: TemplateSchema,
  { language }: Options
) => ({
  title: titleByTemplate(template, toImportEntity),
  template: template._id,
  metadata: await toMetadata(template, toImportEntity),
  ...(await currentEntityIdentifiers(toImportEntity.id, language)),
});

type Options = {
  user?: {};
  language: string;
};

const filterJSObject = (input: { [k: string]: any }, keys: string[]): { [k: string]: any } => {
  const result: { [k: string]: any } = {};
  keys.forEach(k => {
    if (input.hasOwnProperty(k)) {
      result[k] = input[k];
    }
  });
  return result;
};

const arrangeThesauri = async (
  file: ImportFile,
  template: TemplateSchema,
  languages?: string[],
  errorContext?: any
) => {
  let nameToThesauriIdSelects: { [k: string]: string } = {};
  let nameToThesauriIdMultiselects: { [k: string]: string } = {};
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues: Map<string, Set<string>> = new Map();
  const thesauriIdToNormalizedNewValues = new Map();
  const thesauriRelatedProperties = template.properties?.filter(p =>
    ['select', 'multiselect'].includes(p.type)
  );
  thesauriRelatedProperties?.forEach(p => {
    if (p.content && p.type) {
      const thesarusID = p.content.toString();
      if (p.type === propertyTypes.select) {
        nameToThesauriIdSelects[p.name] = thesarusID;
        languages?.forEach(suffix => {
          nameToThesauriIdSelects[`${p.name}__${suffix}`] = thesarusID;
        });
      } else if (p.type === propertyTypes.multiselect) {
        nameToThesauriIdMultiselects[p.name] = thesarusID;
        languages?.forEach(suffix => {
          nameToThesauriIdMultiselects[`${p.name}__${suffix}`] = thesarusID;
        });
      }
    }
  });
  const allRelatedThesauri = await Promise.all(
    Array.from(
      new Set(thesauriRelatedProperties?.map(p => p.content?.toString()).filter(t => t))
    ).map(async id => thesauri.getById(id))
  );
  allRelatedThesauri.forEach(t => {
    if (t) {
      const id = t._id.toString();
      thesauriIdToExistingValues.set(
        id,
        new Set(t.values?.map(v => normalizeThesaurusLabel(v.label)))
      );
      thesauriIdToNewValues.set(id, new Set());
      thesauriIdToNormalizedNewValues.set(id, new Set());
    }
  });
  function handleLabels(id: string, original: string, normalized: string | null) {
    if (
      normalized &&
      !thesauriIdToExistingValues.get(id).has(normalized) &&
      !thesauriIdToNormalizedNewValues.get(id).has(normalized)
    ) {
      thesauriIdToNewValues.get(id)?.add(original);
      thesauriIdToNormalizedNewValues.get(id).add(normalized);
    }
  }
  await csv(await file.readStream(), errorContext?.stopOnError)
    .onRow(async (row: CSVRow, index: number) => {
      if (index === 0) {
        const columnnames = Object.keys(row);
        nameToThesauriIdSelects = filterJSObject(nameToThesauriIdSelects, columnnames);
        nameToThesauriIdMultiselects = filterJSObject(nameToThesauriIdMultiselects, columnnames);
      }
      Object.entries(nameToThesauriIdSelects).forEach(([name, id]) => {
        const label = row[name];
        if (label) {
          const normalizedLabel = normalizeThesaurusLabel(label);
          handleLabels(id, label, normalizedLabel);
        }
      });
      Object.entries(nameToThesauriIdMultiselects).forEach(([name, id]) => {
        const labels = splitMultiselectLabels(row[name]);
        if (labels) {
          Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
            handleLabels(id, originalLabel, normalizedLabel);
          });
        }
      });
    })
    .onError(async (e: Error, row: CSVRow, index: number) => {
      if (errorContext) {
        errorContext._errors[index] = e;
        errorContext.emit('loadError', e, toSafeName(row), index);
      }
    })
    .read();
  await Promise.all(
    allRelatedThesauri.map(thesaurus => {
      if (thesaurus !== null) {
        const newValues: { label: string }[] = Array.from(
          thesauriIdToNewValues.get(thesaurus._id.toString()) || []
        ).map(tval => ({ label: tval }));
        const thesaurusValues = thesaurus.values || [];
        return thesauri.save({
          ...thesaurus,
          values: thesaurusValues.concat(newValues),
        });
      }
    })
  );
};

const importEntity = async (
  toImportEntity: RawEntity,
  template: TemplateSchema,
  importFile: ImportFile,
  { user = {}, language }: Options
) => {
  const { attachments } = toImportEntity;
  delete toImportEntity.attachments;
  const eo = await entityObject(toImportEntity, template, { language });
  const entity = await entities.save(eo, { user, language }, true, false);

  if (toImportEntity.file && entity.sharedId) {
    const file = await importFile.extractFile(toImportEntity.file);
    await processDocument(entity.sharedId, file);
  }

  if (attachments && entity.sharedId) {
    await attachments.split('|').reduce(async (promise: Promise<any>, attachment) => {
      await promise;
      const attachmentFile = await importFile.extractFile(attachment, attachmentsPath());
      return files.save({ ...attachmentFile, entity: entity.sharedId, type: 'attachment' });
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

export { arrangeThesauri, importEntity, translateEntity };
