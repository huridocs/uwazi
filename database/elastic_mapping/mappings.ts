const { USE_ELASTIC_ICU } = process.env;
// eslint-disable-next-line import/no-mutable-exports
let textSortField = {};
if (USE_ELASTIC_ICU === 'true') {
  textSortField = { type: 'icu_collation_keyword', numeric: true };
} else {
  textSortField = { type: 'text', fielddata: true, analyzer: 'string_sorter' };
}

const text = {
  type: 'text',
  analyzer: 'tokenizer',
  fields: {
    raw: { type: 'text' },
    sort: textSortField,
  },
  term_vector: 'with_positions_offsets',
};

const noSorttext = {
  type: 'text',
  analyzer: 'tokenizer',
  fields: {
    raw: { type: 'text' },
  },
  term_vector: 'with_positions_offsets',
};

const noIndexText = {
  type: 'text',
  index: false,
};

const id = {
  type: 'keyword',
  fields: {
    raw: { type: 'keyword' },
    sort: textSortField,
  },
};

const date = {
  type: 'date',
  format: 'epoch_millis',
  fields: {
    raw: { type: 'date', index: false, format: 'epoch_millis' },
    sort: { type: 'date', format: 'epoch_millis' },
  },
};

const nested = { type: 'nested' };
const number = {
  type: 'double',
  doc_values: true,
  fields: {
    raw: { type: 'double', index: false },
    sort: { type: 'double' },
  },
};

const noSortNumber = {
  type: 'double',
  doc_values: true,
};

const textType = () => ({
  value: text,
});

const markdownType = () => ({
  value: noSorttext,
});

const dateType = () => ({
  value: number,
});

const daterangeType = () => ({
  value: {
    properties: {
      from: number,
      to: number,
    },
  },
});

const geolocationType = () => ({
  value: {
    properties: {
      label: text,
      lat: noSortNumber,
      lon: noSortNumber,
    },
  },
});

const imageType = () => ({
  value: noIndexText,
});

const linkType = () => ({
  value: {
    properties: {
      label: text,
      url: noIndexText,
    },
  },
});

const selectType = () => ({
  label: text,
  value: id,
});

const numericType = () => ({
  value: number,
});

const relationshipType = () => ({
  icon: { type: 'object', enabled: false },
  label: text,
  value: id,
  type: noIndexText,
});

const nestedType = () => ({
  value: nested,
});

const propertyMappings = {
  text: textType,
  date: dateType,
  daterange: daterangeType,
  geolocation: geolocationType,
  image: imageType,
  link: linkType,
  markdown: markdownType,
  media: imageType,
  multidate: dateType,
  multidaterange: daterangeType,
  multiselect: selectType,
  nested: nestedType,
  numeric: numericType,
  relationship: relationshipType,
  select: selectType,
  generatedid: textType,
};

export {
  propertyMappings,
  text,
  noSorttext,
  noIndexText,
  id,
  date,
  nested,
  number,
  noSortNumber,
  textSortField,
};
