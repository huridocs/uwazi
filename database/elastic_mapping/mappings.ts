const { USE_ELASTIC_ICU } = process.env;
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

const textType = () => {
  return {
    value: text,
  };
};

const dateType = () => {
  return {
    value: number,
  };
};

const daterangeType = () => {
  return {
    value: {
      properties: {
        from: number,
        to: number,
      },
    },
  };
};

const geolocationType = () => {
  return {
    value: {
      properties: {
        label: text,
        lat: noSortNumber,
        lon: noSortNumber,
      },
    },
  };
};

const imageType = () => {
  return {
    value: noIndexText,
  };
};

const linkType = () => {
  return {
    value: {
      properties: {
        label: text,
        url: noIndexText,
      },
    },
  };
};

const selectType = () => {
  return {
    label: text,
    value: id,
  };
};

const numericType = () => {
  return {
    value: number,
  };
};

const relationshipType = () => {
  return {
    label: text,
    value: id,
    type: noIndexText,
  };
};

const nestedType = () => {
  return {
    value: nested,
  };
};

const propertyMappings = {
  text: textType,
  date: dateType,
  daterange: daterangeType,
  geolocation: geolocationType,
  image: imageType,
  link: linkType,
  markdown: textType,
  media: imageType,
  multidate: dateType,
  multidaterange: daterangeType,
  multiselect: selectType,
  nested: nestedType,
  numeric: numericType,
  relationship: relationshipType,
  select: selectType,
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
