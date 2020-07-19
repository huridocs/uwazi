const { USE_ELASTIC_ICU } = process.env;

const textSorting = {};

if (USE_ELASTIC_ICU) {
  [textSorting.type, textSorting.numeric] = ['icu_collation_keyword', true];
} else {
  [textSorting.type, textSorting.fielddata, textSorting.analyzer] = ['text', true, 'string_sorter'];
}

export default textSorting;
