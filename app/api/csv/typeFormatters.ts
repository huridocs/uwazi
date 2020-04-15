import moment from 'moment';

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

export type FormatterFunction = (field: any[], options: FormatterOptions) => string;

const formatters: {
  [key: string]: FormatterFunction;
} = {
  select: (field: any[]) => (field[0] ? field[0].label : ''),
  multiselect: (field: any[], options) =>
    field.map((item: any) => formatters.select([item], options)).join('|'),
  date: (field: any[], options) =>
    field[0] ? formatDate(field[0].value, options?.dateFormat) : '',
  daterange: (field: any[], options) =>
    field[0]
      ? `${formatDate(field[0].value.from, options?.dateFormat)}~${formatDate(
          field[0].value.to,
          options?.dateFormat
        )}`
      : '',
  geolocation: (field: any[]) => (field[0] ? `${field[0].value.lat}|${field[0].value.lon}` : ''),
  image: (field: any[]) => (field[0] ? field[0].value : ''),
  link: (field: any[]) => (field[0] ? `${field[0].value.label}|${field[0].value.url}` : ''),
  media: (field: any[]) => (field[0] ? field[0].value : ''),
  multidate: (field: any[], options) =>
    field.map((item: any) => formatters.date([item], options)).join('|'),
  multidaterange: (field: any[], options) =>
    field.map((item: any) => formatters.daterange([item], options)).join('|'),
  numeric: (field: any[]) => (field[0] ? field[0].value : ''),
  relationship: (field: any[]) => field.map((relationship: any) => relationship.label).join('|'),
  text: (field: any[]) => (field[0] ? field[0].value : ''),
  documents: (field: any[]) => field.map((item: any) => formatFile(item.filename)).join('|'),
  attachments: (field: any) =>
    field.map((item: any) => formatAttachment(item.filename, item.entityId)).join('|'),
  creationDate: (field: any, options) =>
    moment.utc(field.creationDate).format(options.dateFormat || defaultDateFormat),
};

export default formatters;
