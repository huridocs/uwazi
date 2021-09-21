/* eslint-disable max-statements */
import entities from 'api/entities';
import { search } from 'api/search';
import entitiesModel from 'api/entities/entitiesModel';
import { processDocument } from 'api/files/processDocument';
import { RawEntity } from 'api/csv/entityRow';
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
    ? typeParsers[prop.type](toImportEntity, prop) // ISSUE_1: go down to select typeparser - db calls each row
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
  sharedId ? entities.get({ sharedId, language }, '_id sharedId').then(([e]) => e) : {}; //ISSUE_5 entity.get

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

const arrangeThesauri = async (file: ImportFile, template: TemplateSchema) => {
  const nameToThesauriIdSelects: { [k: string]: string } = {};
  const nameToThesauriIdMultiselects: { [k: string]: string } = {};
  const thesauriIdToExistingValues = new Map();
  const thesauriIdToNewValues: Map<string, Set<string>> = new Map();
  const thesauriIdToNormalizedNewValues = new Map();
  const thesauriRelatedProperties = template.properties?.filter(p =>
    [propertyTypes.select, propertyTypes.multiselect].includes(p.type)
  );
  thesauriRelatedProperties?.forEach(p => {
    if (p.content && p.type) {
      if (p.type === propertyTypes.select) {
        nameToThesauriIdSelects[p.name] = p.content.toString();
      } else if (p.type === propertyTypes.multiselect) {
        nameToThesauriIdMultiselects[p.name] = p.content.toString();
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
  // console.log(nameToThesauriIdSelects)
  // console.log(nameToThesauriIdMultiselects)
  // console.log(allRelatedThesauri)
  // console.log(thesauriIdToExistingValues)
  // console.log(thesauriIdToNewValues);
  // console.log(thesauriIdToNormalizedNewValues);
  console.log('Reading');
  let readCount = 0;
  await csv(await file.readStream())
    .onRow(async (row: CSVRow) => {
      readCount += 1;
      if (readCount % 1000 === 0) {
        console.log(readCount);
      }
      Object.entries(nameToThesauriIdSelects).forEach(([name, id]) => {
        const label = row[name];
        if (label) {
          const normalizedLabel = normalizeThesaurusLabel(label);
          if (
            normalizedLabel &&
            !thesauriIdToExistingValues.get(id).has(normalizedLabel) &&
            !thesauriIdToNormalizedNewValues.get(id).has(normalizedLabel)
          ) {
            thesauriIdToNewValues.get(id)?.add(label);
            thesauriIdToNormalizedNewValues.get(id).add(normalizedLabel);
          }
        }
      });
      Object.entries(nameToThesauriIdMultiselects).forEach(([name, id]) => {
        const labels = splitMultiselectLabels(row[name]);
        if (labels) {
          Object.entries(labels).forEach(([normalizedLabel, originalLabel]) => {
            if (
              normalizedLabel &&
              !thesauriIdToExistingValues.get(id).has(normalizedLabel) &&
              !thesauriIdToNormalizedNewValues.get(id).has(normalizedLabel)
            ) {
              thesauriIdToNewValues.get(id)?.add(originalLabel);
              thesauriIdToNormalizedNewValues.get(id).add(normalizedLabel);
            }
          });
        }
      });
    })
    .onError(async (e: Error, row: CSVRow, index: number) => {
      console.log(e);
    })
    .read();
  console.log('Saving thesauri');
  await Promise.all(
    allRelatedThesauri.map(thesaurus => {
      if (thesaurus !== null) {
        // console.log(thesaurus.name);
        // console.log(thesaurus._id);
        const newValues: { label: string }[] = Array.from(
          thesauriIdToNewValues.get(thesaurus._id.toString()) || []
        ).map(tval => ({ label: tval }));
        // console.log(newValues);
        const thesaurusValues = thesaurus.values || [];
        return thesauri.save({
          ...thesaurus,
          values: thesaurusValues.concat(newValues),
        });
      }
    })
  );
  // console.log(thesauriIdToNewValues);
  // console.log(thesauriIdToNormalizedNewValues);
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
  console.log(eo)
  const entity = await entities.save(eo, { user, language }, true, false); // ISSUE_2: then saves the entity as well
  //ISSUE_3: same with documents
  if (toImportEntity.file && entity.sharedId) {
    const file = await importFile.extractFile(toImportEntity.file);
    await processDocument(entity.sharedId, file);
  }

  //ISSUE_4: same with attachments
  if (attachments && entity.sharedId) {
    await attachments.split('|').reduce(async (promise: Promise<any>, attachment) => {
      await promise;
      const attachmentFile = await importFile.extractFile(attachment, attachmentsPath());
      return files.save({ ...attachmentFile, entity: entity.sharedId, type: 'attachment' }); // <-----here
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
    // ISSUE_6: this also just maps saves
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
        await processDocument(ensure(entity.sharedId), file); //ISSUE_7: process document again
      }
    })
  );

  await search.indexEntities({ sharedId: entity.sharedId }, '+fullText');
};

export { arrangeThesauri, importEntity, translateEntity };
