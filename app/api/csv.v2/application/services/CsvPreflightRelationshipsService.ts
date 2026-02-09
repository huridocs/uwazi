import { Template } from 'api/core/domain/template/Template';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import {
  CsvImportRelationshipValue,
  CsvImportRelationshipValues,
} from '../../domain/CsvImportRelationshipValues';

type RelationshipColumn = {
  property: V1RelationshipProperty;
  index: number;
};
type CollectTitlesParams = {
  rowsDS: CsvImportRowsDataSource;
  importId: string;
  template: Template;
  sanitizedHeaders: string[];
  totalRows: number;
  batchSize: number;
  onProgress: (info: { processedRows: number; totalRows: number }) => void;
};
type CreateMissingEntitiesParams = {
  entitiesDS: MultiLanguageEntityDataSource;
  titlesByTemplate: Map<string, Set<string>>;
  chunkSize: number;
  totalTemplates: number;
  onBatch?: (info: {
    processedTemplates: number;
    totalTemplates: number;
    createdEntities: number;
    pendingTitles: number;
  }) => void;
  createEntities: (params: { templateId: string; titles: string[] }) => Promise<number>;
};
type BuildAppliedValuesParams = {
  entitiesDS: MultiLanguageEntityDataSource;
  importId: string;
  titlesByTemplate: Map<string, Set<string>>;
  chunkSize: number;
};
const MULTI_VALUE_SEPARATOR = '|';

const splitRelationshipValues = (rawValue: unknown) => {
  if (rawValue === null || rawValue === undefined) {
    return [];
  }
  const stringValue = String(rawValue);
  return stringValue
    .split(MULTI_VALUE_SEPARATOR)
    .filter(value => value.trim() !== '')
    .filter((value, index, list) => list.indexOf(value) === index);
};
const buildRelationshipColumnMap = (params: { template: Template; sanitizedHeaders: string[] }) => {
  const { template, sanitizedHeaders } = params;
  return template.allProperties
    .filter(
      (property): property is V1RelationshipProperty => property instanceof V1RelationshipProperty
    )
    .map(property => ({
      property,
      index: sanitizedHeaders.findIndex(header => header === property.name),
    }))
    .filter(({ index }) => index >= 0);
};
const addTitlesForRow = (params: {
  rowValues: string[];
  columns: RelationshipColumn[];
  titlesByTemplate: Map<string, Set<string>>;
}) => {
  const { rowValues, columns, titlesByTemplate } = params;
  columns.forEach(({ property, index }) => {
    const templateId = property.content;
    if (!templateId) {
      return;
    }
    const titles = splitRelationshipValues(rowValues[index]);
    if (!titles.length) {
      return;
    }
    const set = titlesByTemplate.get(templateId) || new Set<string>();
    titles.forEach(title => set.add(title));
    titlesByTemplate.set(templateId, set);
  });
};

const collectRelationshipTitlesFromRows = (params: {
  rows: Array<{ values: string[] }>;
  template: Template;
  sanitizedHeaders: string[];
  titlesByTemplate?: Map<string, Set<string>>;
}) => {
  const { rows, template, sanitizedHeaders } = params;
  const relationshipColumns = buildRelationshipColumnMap({ template, sanitizedHeaders });
  const titlesByTemplate = params.titlesByTemplate ?? new Map<string, Set<string>>();

  rows.forEach(row =>
    addTitlesForRow({
      rowValues: row.values,
      columns: relationshipColumns,
      titlesByTemplate,
    })
  );

  return titlesByTemplate;
};

const chunkList = <T>(items: T[], size: number) => {
  if (!items.length) {
    return [];
  }
  const chunkSize = Math.max(1, size);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

const mergeKnownTitles = (known: Set<string>, incoming: string[]) => {
  incoming.forEach(title => known.add(title));
};
const buildMissingTitles = (titles: string[], known: Set<string>) =>
  titles.filter(title => !known.has(title));

const collectKnownTitles = async (params: {
  entitiesDS: MultiLanguageEntityDataSource;
  templateId: string;
  titles: string[];
  chunkSize: number;
}) => {
  const { entitiesDS, templateId, titles, chunkSize } = params;
  const knownTitles = new Set<string>();
  const chunks = chunkList(titles, chunkSize);
  for (const chunk of chunks) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await entitiesDS.getSharedIdsByTemplateAndTitles(templateId, chunk);
    mergeKnownTitles(
      knownTitles,
      existing.map(entry => entry.title)
    );
  }
  return knownTitles;
};
// eslint-disable-next-line max-statements
const collectRelationshipTitlesForImport = async (params: CollectTitlesParams) => {
  const { rowsDS, importId, template, sanitizedHeaders, totalRows, batchSize, onProgress } = params;
  const relationshipColumns = buildRelationshipColumnMap({ template, sanitizedHeaders });
  const titlesByTemplate = new Map<string, Set<string>>();
  let processedRows = 0;
  for (let offset = 0; offset < totalRows; offset += batchSize) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await rowsDS.getByImport(importId, offset, batchSize);
    if (!rows.length) {
      break;
    }
    rows.forEach(row =>
      addTitlesForRow({
        rowValues: row.values,
        columns: relationshipColumns,
        titlesByTemplate,
      })
    );
    processedRows = Math.min(totalRows, offset + rows.length);
    onProgress({ processedRows, totalRows });
  }

  return titlesByTemplate;
};

// eslint-disable-next-line max-statements
const createMissingEntitiesForTitles = async (params: CreateMissingEntitiesParams) => {
  const { entitiesDS, titlesByTemplate, chunkSize, createEntities, onBatch, totalTemplates } =
    params;
  let createdEntities = 0;
  let templateIndex = 0;

  for (const [templateId, titlesSet] of titlesByTemplate.entries()) {
    const titles = Array.from(titlesSet);
    if (titles.length) {
      const chunks = chunkList(titles, chunkSize);
      // eslint-disable-next-line no-await-in-loop
      const knownTitles = await collectKnownTitles({
        entitiesDS,
        templateId,
        titles,
        chunkSize,
      });
      for (const chunk of chunks) {
        const missingTitles = buildMissingTitles(chunk, knownTitles);
        if (missingTitles.length) {
          onBatch?.({
            processedTemplates: Math.min(templateIndex + 1, totalTemplates),
            totalTemplates,
            createdEntities,
            pendingTitles: missingTitles.length,
          });
          // eslint-disable-next-line no-await-in-loop
          createdEntities += await createEntities({ templateId, titles: missingTitles });
          mergeKnownTitles(knownTitles, missingTitles);
        }
      }
    }
    templateIndex += 1;
  }

  return createdEntities;
};

// eslint-disable-next-line max-statements
const buildRelationshipAppliedValues = async (params: BuildAppliedValuesParams) => {
  const { entitiesDS, importId, titlesByTemplate, chunkSize } = params;
  const docs: CsvImportRelationshipValues[] = [];

  for (const [templateId, titlesSet] of titlesByTemplate.entries()) {
    const titles = Array.from(titlesSet);
    if (titles.length) {
      const chunks = chunkList(titles, chunkSize);
      const values: CsvImportRelationshipValue[] = [];
      const seen = new Set<string>();
      for (const chunk of chunks) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await entitiesDS.getSharedIdsByTemplateAndTitles(templateId, chunk);
        existing.forEach(entry => {
          if (seen.has(entry.sharedId)) {
            return;
          }
          seen.add(entry.sharedId);
          values.push({ label: entry.title, sharedId: entry.sharedId });
        });
      }
      docs.push(
        CsvImportRelationshipValues.create({
          importId,
          templateId,
          values,
          createdAt: Date.now(),
        })
      );
    }
  }

  return docs;
};
export {
  buildRelationshipAppliedValues,
  collectRelationshipTitlesFromRows,
  collectRelationshipTitlesForImport,
  createMissingEntitiesForTitles,
};
