import moment from 'moment-timezone';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { csvConstants } from './csvDefinitions';

const defaultDateFormat = 'YYYY-MM-DD';

const mapFormatToMoment = (format: string) => format.replace('dd', 'DD').replace('yyyy', 'YYYY');

export const formatDate = (timestamp: number, format: string = defaultDateFormat) =>
  moment.unix(timestamp).utc().format(mapFormatToMoment(format));

export const formatFile = (fileName: string) => `/files/${fileName}`;

export const formatAttachment = (fileName: string, hostname: string) =>
  `https://${hostname}/api/files/${fileName}`;

export type FormatterOptions = {
  dateFormat?: string;
};

export type FormatterFunction = (
  field: MetadataObjectSchema[],
  options: FormatterOptions
) => string;

const multiSelectFormatter: FormatterFunction = field =>
  field
    .map(entry =>
      entry.parent
        ? `${entry.parent.label}${csvConstants.dictionaryParentChildSeparator}${entry.label}`
        : entry.label
    )
    .join(csvConstants.multiValueSeparator);

export const formatters: {
  [key: string]: FormatterFunction;
} = {
  select: multiSelectFormatter,
  multiselect: multiSelectFormatter,
  date: (field, options) =>
    field[0] && field[0].value ? formatDate(<number>field[0].value, options?.dateFormat) : '',
  daterange: (field, options) =>
    field[0] && field[0].value
      ? `${formatDate((<any>field[0].value).from, options?.dateFormat)}${
          csvConstants.dateRangeExportSeparator
        }${formatDate((<any>field[0].value).to, options?.dateFormat)}`
      : '',
  geolocation: field =>
    field[0] && field[0].value ? `${(<any>field[0].value).lat}|${(<any>field[0].value).lon}` : '',
  link: field =>
    field[0] && field[0].value ? `${(<any>field[0].value).label}|${(<any>field[0].value).url}` : '',
  multidate: (field, options) =>
    field.map(item => formatters.date([item], options)).join(csvConstants.multiValueSeparator),
  multidaterange: (field, options) =>
    field.map(item => formatters.daterange([item], options)).join(csvConstants.multiValueSeparator),
  numeric: field =>
    field[0] && (field[0].value || field[0].value === 0) ? field[0].value.toString() : '',
  relationship: (field: MetadataObjectSchema[]) =>
    field
      .map(relationship => {
        if (Array.isArray(relationship.inheritedValue) && relationship.inheritedType) {
          const inheritedFormatter = formatters[relationship.inheritedType] || formatters.default;
          return inheritedFormatter(relationship.inheritedValue, {});
        }
        return relationship.label;
      })
      .filter(r => !!r)
      .join(csvConstants.multiValueSeparator),
  text: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  default: field => formatters.text(field, {}),
};

export const formatDocuments = (row: any) =>
  (row.documents || [])
    .map((item: any) => formatFile(item.filename))
    .join(csvConstants.multiValueSeparator);
export const formatAttachments = (row: any, hostname: string) =>
  (row.attachments || [])
    .map((item: any) => formatAttachment(item.filename, hostname))
    .join(csvConstants.multiValueSeparator);
export const formatCreationDate = (row: any, options: FormatterOptions) =>
  moment(row.creationDate).format(mapFormatToMoment(options.dateFormat || defaultDateFormat));
