import moment from 'moment';

export const formatDate = (timestamp: number, format: string = 'YYYY-MM-DD') =>
  moment.unix(timestamp).format(format);

export const formatFile = (fileName: string) => `/files/${fileName}`;

export const formatAttachment = (fileName: string, entityId: string) =>
  `/api/attachments/download?_id=${entityId}&file=${fileName}`;

const formatters: {
  [key: string]: (field: any, options?: any) => string;
} = {
  select: (field: any) => (field && field[0] ? field[0].label : ''),
  multiselect: (field: any) => field?.map((item: any) => formatters.select([item])).join('|') || '',
  date: (field: any, { dateFormat } = {}) =>
    field && field[0] ? formatDate(field[0].value, dateFormat) : '',
  daterange: (field: any, { dateFormat } = {}) =>
    field && field[0]
      ? `${formatDate(field[0].value.from, dateFormat)}~${formatDate(
          field[0].value.to,
          dateFormat
        )}`
      : '',
  geolocation: (field: any) =>
    field && field[0] ? `${field[0].value.lat}|${field[0].value.lon}` : '',
  image: (field: any) => (field && field[0] ? field[0].value : ''),
  link: (field: any) => (field && field[0] ? `${field[0].value.label}|${field[0].value.url}` : ''),
  media: (field: any) => (field && field[0] ? field[0].value : ''),
  multidate: (field: any, { dateFormat } = {}) =>
    field?.map((item: any) => formatters.date([item], dateFormat)).join('|') || '',
  multidaterange: (field: any, { dateFormat } = {}) =>
    field?.map((item: any) => formatters.daterange([item], dateFormat)).join('|') || '',
  numeric: (field: any) => (field && field[0] ? field[0].value : ''),
  relationship: (field: any) =>
    field?.map((relationship: any) => relationship.label).join('|') || '',
  text: (field: any) => (field && field[0] ? field[0].value : ''),
  documents: (field: any) => field?.map((item: any) => formatFile(item.filename)).join('|') || '',
  attachments: (field: any) =>
    field.attachments
      ?.map((item: any) => formatAttachment(item.filename, field.entityId))
      .join('|') || '',
  published: (field: any) => {
    if (field.published !== undefined) {
      return field.published ? 'Published' : 'Unpublished';
    }

    return '';
  },
};

export default formatters;
