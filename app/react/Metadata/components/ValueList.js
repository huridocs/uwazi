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
        ', '
      );

const ValueList = ({ property, compact }) =>
  compact ? renderCompact(property) : renderList(property);

export default ValueList;
