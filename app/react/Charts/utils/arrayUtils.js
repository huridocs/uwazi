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

function populateLabels(data, context, options) {
  return data
    .map(item => {
      const labelData = options && options.find(o => o.id === item.key);
      if (!labelData) {
        return null;
      }

      const label = t(context, labelData.label, null, false);
      return { ...item, label };
    })
    .filter(i => !!i);
}

function sortData(relevant, sort = { by: 'result', order: 'desc' }) {
  let categories = relevant;

  if (sort.by === 'result') {
    categories = relevant.sort((a, b) => b.filtered.doc_count - a.filtered.doc_count);
  }

  if (sort.by === 'label') {
    categories = relevant.sort((a, b) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    );
  }

  return categories;
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
  { context, excludeZero, maxCategories, aggregateOthers = false, labelsMap = {}, sort }
) => {
  const res = populateOptions([{ content: context }], thesauris.toJS());
  const { options } = res[0];

  let relevant = data.toJS().filter(i => i.key !== 'missing');

  if (excludeZero) {
    relevant = relevant.filter(i => i.filtered.doc_count !== 0);
  }

  let categories = sortData(populateLabels(relevant, context, options), sort);

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

  return categories.map(item => {
    if (item.others && item.filtered.doc_count) {
      return { others: true, id: item.key, label: 'others', results: item.filtered.doc_count };
    }

    return {
      id: item.key,
      label: labelsMap[item.label] || item.label,
      results: item.filtered.doc_count,
    };
  });
};

export default {
  sortValues,
  formatPayload,
  formatDataForChart,
};
