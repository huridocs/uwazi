import React from 'react';

import { Icon } from '../../Layout';

const composeIcon = data =>
  typeof data.value === 'string' && data.icon !== undefined ? (
    <>
      <Icon data={data.icon} />
      <span>&nbsp;</span>
    </>
  ) : null;

const composeCount = (data, key) => {
  if (data.valueCount > 1) {
    return (
      <React.Fragment key={key}>
        {composeIcon(data)}
        {data.value}
        &nbsp;
        <span className="item-count">{data.valueCount}</span>
      </React.Fragment>
    );
  }
  return (
    <>
      {composeIcon(data)}
      {data.value}
    </>
  );
};

const renderItemValue = (v, key, i) => (
  <li key={key} className="item-value">
    {composeCount(v, `item-value-${i}`)}
  </li>
);

const renderList = prop => (
  <ul className="multiline">
    {prop.value.map((v, index) => {
      const key = `${prop.name}_${index}`;
      return renderItemValue(v, key, index);
    })}
  </ul>
);

const renderCompact = prop => (
  <ul className="compact comma-separated">{prop.value.map((v, i) => renderItemValue(v, i, i))}</ul>
);

const groupRepeatedValues = property =>
  property.value.reduce((results, v) => {
    const previousValue = results.find(r => r.value === v.value);
    if (previousValue) {
      previousValue.valueCount += 1;
    } else {
      results.push({ ...v, valueCount: 1 });
    }
    return results;
  }, []);

const ValueList = ({ property, compact }) => {
  const propertyWithGroupedValues = { ...property, value: groupRepeatedValues(property) };
  return compact ? renderCompact(propertyWithGroupedValues) : renderList(propertyWithGroupedValues);
};

export default ValueList;
