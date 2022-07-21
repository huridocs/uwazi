import React from 'react';

import { Icon } from '../../Layout';

const composeCount = (data, key) => {
  if (data.valueCount > 1) {
    return (
      <React.Fragment key={key}>
        {typeof data.value === 'string' && data.icon !== undefined && <Icon data={data.icon} />}
        {data.value}
        <span className="item-count">{data.valueCount}</span>
      </React.Fragment>
    );
  }
  return (
    <>
      {typeof data.value === 'string' && data.icon !== undefined && <Icon data={data.icon} />}
      {data.value}
    </>
  );
};

const renderItemValue = (v, i) => (
  <div className="item-value">{composeCount(v, `item-value-${i}`)}</div>
);

const renderList = prop => (
  <ul className="multiline">
    {prop.value.map((v, index) => {
      const key = `${prop.name}_${index}`;
      return <li key={key}>{renderItemValue(v, index)}</li>;
    })}
  </ul>
);

const renderCompact = prop => (
  <div className="compact">{prop.value.map((v, i) => renderItemValue(v, i))}</div>
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
