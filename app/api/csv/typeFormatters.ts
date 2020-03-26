import moment from 'moment';
import { TemplateSchema } from 'shared/types/templateType';

export const formatDate = (timestamp: number, format: string = 'YYYY-MM-DD') =>
  moment.unix(timestamp).format(format);

const formatFile = (fileName: string) => `/files/${fileName}`;
const formatAttachment = (fileName: string, entityId: string) =>
  `/api/attachments/download?_id=${entityId}&file=${fileName}`;

const formatters: {
  [key: string]: (field: any, rowTemplate?: TemplateSchema, dateFormat?: string) => string;
} = {
  select: (field: any) => (field[0] ? field[0].label : ''),
  multiselect: (field: any) => field.map((item: any) => formatters.select([item])).join('|') || '',
  date: (field: any, _rowTemplate, format) => (field[0] ? formatDate(field[0].value, format) : ''),
  daterange: (field: any, _rowTemplate, format) =>
    field[0]
      ? `${formatDate(field[0].value.from, format)}~${formatDate(field[0].value.to, format)}`
      : '',
  geolocation: (field: any) => (field[0] ? `${field[0].value.lat}|${field[0].value.lon}` : ''),
  image: (field: any) => (field[0] ? field[0].value : ''),
  link: (field: any) => (field[0] ? `${field[0].value.label}|${field[0].value.url}` : ''),
  media: (field: any) => (field[0] ? field[0].value : ''),
  multidate: (field: any, _rowTemplate, format) =>
    field.map((item: any) => formatters.date([item], _rowTemplate, format)).join('|') || '',
  multidaterange: (field: any, _rowTemplate, format) =>
    field.map((item: any) => formatters.daterange([item], _rowTemplate, format)).join('|') || '',
  numeric: (field: any) => (field[0] ? field[0].value : ''),
  relationship: (field: any) =>
    field.map((relationship: any) => relationship.label).join('|') || '',
  text: (field: any) => (field[0] ? field[0].value : ''),
  documents: (field: any) => field.map((item: any) => formatFile(item.filename)).join('|') || '',
  attachments: (field: any) =>
    field.attachments.map((item: any) => formatAttachment(item.filename, field.entityId)).join('|'),
};

export default formatters;
