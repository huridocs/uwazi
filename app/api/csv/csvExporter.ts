import { EventEmitter } from 'events';
import * as csv from '@fast-csv/format';
import { FilePath } from 'api/files/filesystem';
import * as fs from 'fs';
import templates from 'api/templates';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import settings from 'api/settings';
import formatters, { formatDate } from './typeFormatters';

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

export const notDuplicated = (collection: any) => (item: any) =>
  collection.findIndex((i: any) => Object.keys(i).every(key => i[key] === item[key])) < 0;

export const excludedProperties = (property: PropertySchema) =>
  !['geolocation', 'preview', 'markdown'].includes(property.type);

export const processHeaders = (templatesCache: any): string[] =>
  Object.values(templatesCache).reduce(
    (memo: any[], template: any) =>
      memo.concat(
        template.properties
          .filter(excludedProperties)
          .map((property: any) => ({ label: property.label, name: property.name }))
          .filter(notDuplicated(memo))
      ),
    []
  );

export const prependCommonHeaders = (headers: any[]) =>
  [
    {
      label: 'Title',
      name: 'title',
      common: true,
    },
    {
      label: 'Creation date',
      name: 'creationDate',
      common: true,
    },
    {
      label: 'Template',
      name: 'template',
      common: true,
    },
  ].concat(headers);

export const concatCommonHeaders = (headers: any[]) =>
  headers.concat([
    { label: 'Geolocation', name: 'geolocation', common: true },
    { label: 'Documents', name: 'documents', common: true },
    { label: 'Attachments', name: 'attachments', common: true },
  ]);

export const processGeolocationField = (row: any, rowTemplate: TemplateSchema) => {
  if (!rowTemplate.properties) return '';

  const geolocationField: PropertySchema | undefined = rowTemplate.properties.find(
    property => property.type === 'geolocation'
  );

  if (geolocationField && geolocationField.name) {
    return formatters.geolocation(row.metadata[geolocationField.name]);
  }

  return '';
};

export const processEntity = (
  row: any,
  headers: any[],
  templatesCache: any,
  dateFormat: string
) => {
  const rowTemplate: TemplateSchema = templatesCache[row.template];

  return headers.map((header: any) => {
    if (header.common) {
      switch (header.name) {
        case 'title':
          return row.title;
        case 'template':
          return rowTemplate.name;
        case 'creationDate':
          return formatDate(row.creationDate, dateFormat);
        case 'geolocation':
          return processGeolocationField(row, rowTemplate);
        case 'documents':
          return formatters.documents(row.documents);
        case 'attachments':
          return formatters.attachments({ attachments: row.attachments, entityId: row._id });
        default:
          return '';
      }
    }

    const templateProperty = rowTemplate?.properties?.find(
      (property: PropertySchema) => property.name === header.name
    );

    if (!templateProperty) {
      return '';
    }

    return formatters[templateProperty.type](row.metadata[header.name], rowTemplate, dateFormat);
  });
};

export default class CSVExporter extends EventEmitter {
  async export(searchResults: SearchResults): Promise<any> {
    const csvStream = csv.format({ headers: false });
    //const writeStream = fs.createWriteStream(filePath);

    csvStream.pipe(process.stdout);

    const templatesCache = await getTemplatesModels(getTypes(searchResults));
    const headers = prependCommonHeaders(concatCommonHeaders(processHeaders(templatesCache)));
    const { dateFormat } = await settings.get();

    csvStream.write(headers.map((h: any) => h.label));
    searchResults.rows.forEach(row => {
      csvStream.write(processEntity(row, headers, templatesCache, dateFormat));
      this.emit('EXPORT_CSV_PROGRESS');
    });
    csvStream.end();
    return this;
  }
}
