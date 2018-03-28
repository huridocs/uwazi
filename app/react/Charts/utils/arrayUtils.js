import React from 'react';
import colorScheme from './colorScheme';

function sortValues(values) {
  values.sort((a, b) => {
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
    formatter: () => <span style={{ color: '#333' }}>{item.name}</span>
  }));
}

export default {
  sortValues,
  formatPayload
};
