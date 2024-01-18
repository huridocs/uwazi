import moment from 'moment-timezone';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { csvConstants } from './csvConstants';

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
    .join('|');

export const formatters: {
  [key: string]: FormatterFunction;
} = {
  select: multiSelectFormatter,
  multiselect: multiSelectFormatter,
  date: (field, options) =>
    field[0] && field[0].value ? formatDate(<number>field[0].value, options?.dateFormat) : '',
  daterange: (field, options) =>
    field[0] && field[0].value
      ? `${formatDate((<any>field[0].value).from, options?.dateFormat)}~${formatDate(
          (<any>field[0].value).to,
          options?.dateFormat
        )}`
      : '',
  geolocation: field =>
    field[0] && field[0].value ? `${(<any>field[0].value).lat}|${(<any>field[0].value).lon}` : '',
  link: field =>
    field[0] && field[0].value ? `${(<any>field[0].value).label}|${(<any>field[0].value).url}` : '',
  multidate: (field, options) => field.map(item => formatters.date([item], options)).join('|'),
  multidaterange: (field, options) =>
    field.map(item => formatters.daterange([item], options)).join('|'),
  numeric: field =>
    field[0] && (field[0].value || field[0].value === 0) ? <string>field[0].value : '',
  relationship: (field: MetadataObjectSchema[]) =>
    field
      .map(relationship => {
        if (
          relationship.inheritedValue &&
          relationship.inheritedValue.length &&
          relationship.inheritedType
        ) {
          const inheritedFormatter = formatters[relationship.inheritedType] || formatters.default;
          return inheritedFormatter(relationship.inheritedValue, {});
        }
        return relationship.label;
      })
      .join('|'),
  text: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  default: field => formatters.text(field, {}),
};

export const formatDocuments = (row: any) =>
  (row.documents || []).map((item: any) => formatFile(item.filename)).join('|');
export const formatAttachments = (row: any, hostname: string) =>
  (row.attachments || []).map((item: any) => formatAttachment(item.filename, hostname)).join('|');
export const formatCreationDate = (row: any, options: FormatterOptions) =>
  moment(row.creationDate).format(mapFormatToMoment(options.dateFormat || defaultDateFormat));
