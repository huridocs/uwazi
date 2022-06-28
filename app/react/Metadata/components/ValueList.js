import React from 'react';

import { Icon } from '../../Layout';

const withIcon = v =>
  v.icon ? (
    <>
      <Icon className="item-icon item-icon-center" data={v.icon} />
      {v.value}
    </>
  ) : (
    v.value
  );

const interpose = (array, separator) => [].concat(...array.map(e => [separator, e])).slice(1);

const renderList = prop => (
  <ul className="multiline">
    {prop.value.map((v, index) => {
      const key = `${prop.name}_${index}`;
      return <li key={key}>{withIcon(v)}</li>;
    })}
  </ul>
);

const renderCompact = prop =>
  prop.type === 'multidate' || prop.type === 'multidaterange'
    ? interpose(
        prop.value.map(v => v.value),
        <br />
      )
    : interpose(
        prop.value.map(v => withIcon(v)),
        <span>, </span>
      );

const groupRepeatedValues = property =>
  property.value
    .reduce((results, v) => {
      const previousValue = results.find(r => r.value === v.value);
      if (previousValue) {
        previousValue.valueCount += 1;
      } else {
        results.push({ ...v, valueCount: 1 });
      }
      return results;
    }, [])
    .map(v => ({ ...v, value: v.valueCount > 1 ? `${v.value} (${v.valueCount})` : v.value }));

const ValueList = ({ property, compact }) => {
  const propertyWithGroupedValues = { ...property, value: groupRepeatedValues(property) };
  return compact ? renderCompact(propertyWithGroupedValues) : renderList(propertyWithGroupedValues);
};

export default ValueList;
