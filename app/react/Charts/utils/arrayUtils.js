import React from 'react';
import { t } from 'app/I18N';
import colorScheme from './colorScheme';

const compareStrings = (a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase());
const compareDocCount = (a, b) => b.filtered.doc_count - a.filtered.doc_count;

const sortValues = values => {
  values.sort((a, b) => {
    if (a.others || b.others) {
      return false;
    }

    if (a.results === b.results) {
      return compareStrings(a, b);
    }

    return b.results - a.results;
  });

  return values;
};

const sortAndOrder = (data, method, order, reverseCondition) => {
  data.sort(method);
  return order === reverseCondition ? data.reverse() : data;
};

const sortData = (data, { by = 'result', order } = {}) => {
  if (by === 'result') {
    return sortAndOrder(data, compareDocCount, order, 'asc');
  }

  if (by === 'label') {
    return sortAndOrder(data, compareStrings, order, 'desc');
  }

  return data;
};

const limitMaxCategories = (sortedCategories, maxCategories, aggregateOthers) => {
  const categories = sortedCategories.slice(0, Number(maxCategories));

  if (aggregateOthers) {
    categories[categories.length] = sortedCategories.slice(Number(maxCategories)).reduce(
      (memo, category) => {
        // eslint-disable-next-line
        memo.filtered.doc_count += category.filtered.doc_count;
        return memo;
      },
      { others: true, key: 'others', filtered: { doc_count: 0 } }
    );
  }

  return categories;
};

const determineRelevantCategories = (data, formatOptions) => {
  const { excludeZero, pluckCategories = [] } = formatOptions;
  let relevantCategories = data.filter(i => i.key !== 'missing' && i.key !== 'any');

  if (excludeZero) {
    relevantCategories = relevantCategories.filter(i => i.filtered.doc_count !== 0);
  }

  if (pluckCategories.length) {
    relevantCategories = pluckCategories.reduce((results, category) => {
      const matchingCategory = relevantCategories.find(c => c.label === category);
      if (matchingCategory) {
        results.push(matchingCategory);
      }
      return results;
    }, []);
  }

  return relevantCategories;
};

const formatPayload = data =>
  data.map((item, index) => ({
    value: item.name,
    type: 'rect',
    color: colorScheme[index % colorScheme.length],
    formatter: () => <span style={{ color: '#333' }}>{item.name}</span>,
  }));

const formatForNestedValues = (category, options) => {
  const { labelsMap = {}, excludeZero, context } = options;
  const flatValues = category.values.map(value => ({
    id: value.key,
    label: labelsMap[value.label] || t(context, value.label, null, false),
    results: value.filtered.doc_count,
    parent: labelsMap[category.label] || t(context, category.label, null, false),
  }));
  if (excludeZero) {
    return flatValues.filter(value => value.results !== 0);
  }
  return flatValues;
};

const formatDataForChart = (data, _property, formatOptions) => {
  const { maxCategories, aggregateOthers = false, labelsMap = {}, sort, context } = formatOptions;

  const relevantCategories = determineRelevantCategories(data.toJS(), formatOptions);
  const sortedCategories = sortData(relevantCategories, sort);

  let categories = sortedCategories;

  if (Number(maxCategories)) {
    categories = limitMaxCategories(sortedCategories, maxCategories, aggregateOthers);
  }

  return [].concat(
    ...categories
      .map(item => {
        if (item.others && item.filtered.doc_count) {
          return { others: true, id: item.key, label: 'others', results: item.filtered.doc_count };
        }

        if (!item.label) {
          return null;
        }

        if (item.values && formatOptions.scatter) {
          return formatForNestedValues(item, formatOptions);
        }

        return {
          id: item.key,
          label: labelsMap[item.label] || t(context, item.label, null, false),
          results: item.filtered.doc_count,
        };
      })
      .filter(i => !!i)
  );
};

export default {
  sortValues,
  formatPayload,
  formatDataForChart,
};
