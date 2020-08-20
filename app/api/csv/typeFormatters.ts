import moment from 'moment';
import { MetadataObjectSchema } from 'shared/types/commonTypes';

const defaultDateFormat = 'YYYY-MM-DD';
export const formatDate = (timestamp: number, format: string = defaultDateFormat) =>
  moment
    .unix(timestamp)
    .utc()
    .format(format);

export const formatFile = (fileName: string) => `/files/${fileName}`;

export const formatAttachment = (fileName: string, entityId: string) =>
  `/api/attachments/download?_id=${entityId}&file=${fileName}`;

export type FormatterOptions = {
  dateFormat?: string;
};

export type FormatterFunction = (
  field: MetadataObjectSchema[],
  options: FormatterOptions
) => string;

export const formatters: {
  [key: string]: FormatterFunction;
} = {
  select: field => (field[0] && field[0].value && field[0].label ? field[0].label : ''),
  multiselect: (field, options) => field.map(item => formatters.select([item], options)).join('|'),
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
  image: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  link: field =>
    field[0] && field[0].value ? `${(<any>field[0].value).label}|${(<any>field[0].value).url}` : '',
  media: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  multidate: (field, options) => field.map(item => formatters.date([item], options)).join('|'),
  multidaterange: (field, options) =>
    field.map(item => formatters.daterange([item], options)).join('|'),
  numeric: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  relationship: field => field.map(relationship => relationship.label).join('|'),
  text: field => (field[0] && field[0].value ? <string>field[0].value : ''),
  markdown: field => (field[0] && field[0].value ? <string>field[0].value : ''),
};

export const formatDocuments = (row: any) =>
  (row.documents || []).map((item: any) => formatFile(item.filename)).join('|');
export const formatAttachments = (row: any) =>
  (row.attachments || []).map((item: any) => formatAttachment(item.filename, row._id)).join('|');
export const formatCreationDate = (row: any, options: FormatterOptions) =>
  moment.utc(row.creationDate).format(options.dateFormat || defaultDateFormat);
