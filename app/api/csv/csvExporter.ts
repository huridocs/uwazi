import { EventEmitter } from 'events';
import * as csv from 'fast-csv';
import { FilePath } from 'api/files/filesystem';
import * as fs from 'fs';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import formatters from './typeFormatters';

export type SearchResults = {
  rows: any[];
  totalRows: number;
  aggregations: {
    all: {
      _types: {
        buckets: [
          {
            key: string;
            // eslint-disable-next-line camelcase
            filtered: { doc_count: number };
          }
        ];
      };
    };
  };
};

export const getTypes = (searchResults: SearchResults) =>
  searchResults.aggregations.all._types.buckets
    .filter(bucket => bucket.filtered.doc_count > 0)
    .map(bucket => bucket.key);

const hasValue = (value: string) => value !== 'missing';

export const getTemplatesModels = async (templateIds: string[]) =>
  Promise.all(
    templateIds.filter(hasValue).map(async (id: string) => templates.getById(id))
  ).then(results =>
    results.reduce<any>(
      (memo, template) => (template ? { ...memo, [template._id]: template } : null),
      {}
    )
  );

const isSelectOrMultiselect = (property: any) => ['select', 'multiselect'].includes(property.type);
const notIncludedIn = (collection: any[]) => (item: any) => !collection.includes(item);

export const extractThesaurus = (templatesToExtract: any) =>
  Object.values(templatesToExtract).reduce(
    (memo: string[], template: any) =>
      memo.concat(
        template.properties
          ?.filter(isSelectOrMultiselect)
          ?.map((item: any) => item.content)
          .filter(notIncludedIn(memo))
      ),
    []
  );

export const getThesaurus = async (thesaurusIds: string[]) =>
  Promise.all(thesaurusIds.map(async (id: string) => thesauri.getById(id))).then(results =>
    results.reduce<any>(
      (memo, current) => (current ? { ...memo, [current._id]: thesauri } : null),
      {}
    )
  );

//export const headerEquals = (header1: any, header2: any) =>
//  header1.label === header2.label && header1.name === header2.name;

export const notDuplicated = (collection: any) => (item: any) =>
  collection.findIndex((i: any) => Object.keys(i).every(key => i[key] === item[key])) < 0;

export const processHeaders = (templatesCache: any): string[] =>
  Object.values(templatesCache).reduce(
    (memo: any[], template: any) =>
      memo.concat(
        template.properties
          .map((property: any) => ({ label: property.label, name: property.name }))
          .filter(notDuplicated(memo))
      ),
    []
  );

export const processEntity = (
  row: any,
  headers: any[],
  templatesCache: any,
  thesaurusCache: any
) => {
  const rowTemplate: TemplateSchema = templatesCache[row.template];
  return headers.map((header: any) => {
    const templateProperty = rowTemplate?.properties?.find(
      (property: PropertySchema) => property.name === header.name
    );
    if (!templateProperty) {
      return '';
    }

    return formatters[templateProperty.type](
      row.metadata[header.name],
      rowTemplate,
      thesaurusCache
    );
  });
};

export default class CSVExporter extends EventEmitter {
  async export(searchResults: SearchResults): Promise<any> {
    const csvStream = csv.format({ headers: false });
    //const writeStream = fs.createWriteStream(filePath);

    csvStream.pipe(process.stdout);

    const templatesCache = await getTemplatesModels(getTypes(searchResults));
    const thesaurusCache = await getThesaurus(extractThesaurus(templatesCache));
    const headers = processHeaders(templatesCache);

    csvStream.write(headers.map((h: any) => h.label));
    searchResults.rows.forEach(row => {
      csvStream.write(processEntity(row, headers, templatesCache, thesaurusCache));
      this.emit('EXPORT_CSV_PROGRESS');
    });
    csvStream.end();
    return this;
  }
}
