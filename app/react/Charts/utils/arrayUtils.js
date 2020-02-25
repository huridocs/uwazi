import React from 'react';
import { t } from 'app/I18N';
import { populateOptions } from 'app/Library/helpers/libraryFilters';

import colorScheme from './colorScheme';

function sortValues(values) {
  values.sort((a, b) => {
    if (a.others || b.others) {
      return false;
    }

    if (a.results === b.results) {
      return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
    }

    return b.results - a.results;
  });

  return values;
}

function formatPayload(data) {
  return data.map((item, index) => ({
    value: item.name,
    type: 'rect',
    color: colorScheme[index % colorScheme.length],
    formatter: () => <span style={{ color: '#333' }}>{item.name}</span>,
  }));
}

const formatDataForChart = (
  data,
  _property,
  thesauris,
  { context, excludeZero, maxCategories, aggregateOthers = false }
) => {
  const res = populateOptions([{ content: context }], thesauris.toJS());
  const { options } = res[0];

  let relevant = data.toJS().filter(i => i.key !== 'missing');

  if (excludeZero) {
    relevant = relevant.filter(i => i.filtered.doc_count !== 0);
  }

  let categories = relevant.sort((a, b) => b.filtered.doc_count - a.filtered.doc_count);

  if (Number(maxCategories)) {
    categories = relevant.slice(0, Number(maxCategories));
    categories[categories.length] = relevant.slice(Number(maxCategories)).reduce(
      (memo, category) => {
        // eslint-disable-next-line
        memo.filtered.doc_count += category.filtered.doc_count;
        return memo;
      },
      { others: aggregateOthers, key: 'others', filtered: { doc_count: 0 } }
    );
  }

  return categories
    .map(item => {
      if (item.others && item.filtered.doc_count) {
        return { others: true, id: item.key, label: 'others', results: item.filtered.doc_count };
      }

      const label = options && options.find(o => o.id === item.key);
      if (!label) {
        return null;
      }

      return {
        id: item.key,
        label: t(context, label.label, null, false),
        results: item.filtered.doc_count,
      };
    })
    .filter(i => !!i);
};

export default {
  sortValues,
  formatPayload,
  formatDataForChart,
};
