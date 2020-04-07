import { EventEmitter } from 'events';
import * as csv from '@fast-csv/format';
import templates from 'api/templates';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
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

export type ExporterOptions = {
  dateFormat: string;
};

export type ExportHeader = {
  label: string;
  name: string;
  common: boolean;
};

export type TemplatesCache = {
  [id: string]: TemplateSchema;
};

export const getTypes = (searchResults: SearchResults, typesWhitelist: string[]) =>
  typesWhitelist.length > 0
    ? typesWhitelist
    : searchResults.aggregations.all._types.buckets
        .filter(bucket => bucket.filtered.doc_count > 0)
        .map(bucket => bucket.key);

const hasValue = (value: string) => value !== 'missing';

export const getTemplatesModels = async (templateIds: string[]): Promise<TemplatesCache> =>
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

export const processHeaders = (templatesCache: TemplatesCache): ExportHeader[] =>
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

export const prependCommonHeaders = (headers: ExportHeader[]) =>
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

export const concatCommonHeaders = (headers: ExportHeader[]) =>
  headers.concat([
    { label: 'Geolocation', name: 'geolocation', common: true },
    { label: 'Documents', name: 'documents', common: true },
    { label: 'Attachments', name: 'attachments', common: true },
    { label: 'Published', name: 'published', common: true },
  ]);

export const processGeolocationField = (row: any, rowTemplate: TemplateSchema) => {
  if (!rowTemplate.properties) return '';

  const geolocationField: PropertySchema | undefined = rowTemplate.properties.find(
    property => property.type === 'geolocation'
  );

  if (geolocationField && geolocationField.name) {
    return formatters.geolocation(row.metadata[geolocationField.name], {});
  }

  return '';
};

export const processCommonField = (
  headerName: string,
  row: any,
  rowTemplate: TemplateSchema,
  options: any
) => {
  switch (headerName) {
    case 'title':
      return row.title;
    case 'template':
      return rowTemplate.name;
    case 'creationDate':
      return formatDate(row.creationDate, options.dateFormat);
    case 'geolocation':
      return processGeolocationField(row, rowTemplate);
    case 'documents':
      return formatters.documents(row.documents, options);
    case 'attachments':
      return formatters.attachments(
        row.attachments.map((attachment: any) => ({ ...attachment, entityId: row._id })),
        options
      );
    case 'published':
      return row.published ? 'Published' : 'Unpublished';
    default:
      return '';
  }
};

export const processEntity = (
  row: any,
  headers: ExportHeader[],
  templatesCache: TemplatesCache,
  options: ExporterOptions
) => {
  const rowTemplate: TemplateSchema = templatesCache[row.template];

  if (!rowTemplate) {
    throw new Error('Entity missing template');
  }

  return headers.map((header: ExportHeader) => {
    if (header.common) {
      return processCommonField(header.name, row, rowTemplate, options);
    }

    if (!row.metadata[header.name]) {
      return '';
    }

    const templateProperty = rowTemplate?.properties?.find(
      (property: PropertySchema) => property.name === header.name
    );

    if (!templateProperty) {
      return '';
    }

    return formatters[templateProperty.type](row.metadata[header.name], options);
  });
};

export default class CSVExporter extends EventEmitter {
  async export(
    searchResults: SearchResults,
    types: string[] = [],
    writeStream: WritableStream,
    options: ExporterOptions = { dateFormat: 'YYY-MM-DD' }
  ): Promise<void> {
    const csvStream = csv.format({ headers: false });

    csvStream.pipe<any>(writeStream);

    const templatesCache = await getTemplatesModels(getTypes(searchResults, types));
    const headers = prependCommonHeaders(concatCommonHeaders(processHeaders(templatesCache)));

    csvStream.write(headers.map((h: any) => h.label));
    searchResults.rows.forEach(row => {
      csvStream.write(processEntity(row, headers, templatesCache, options));
      this.emit('entityProcessed');
    });
    csvStream.end();
  }
}
