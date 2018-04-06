import React from 'react';
import { I18NLink } from 'app/I18N';

const interpose = (array, separator) => [].concat(...array.map(e => [separator, e])).slice(1);

const renderList = prop => (
  <ul className="multiline">
    {prop.value.map((v) => {
      const key = prop.label + v.value;
      if (v.url) {
        return <li key={key}><I18NLink to={v.url}>{v.value}</I18NLink></li>;
      }
      return <li key={key}>{v.value}</li>;
    })}
  </ul>
);

const renderCompact = prop => (
  prop.type === 'multidate' || prop.type === 'multidaterange' ?
    interpose(prop.value.map(v => v.value), <br />) :
    prop.value.map(v => v.value).join(', ')
);

const ValueList = ({ property, compact }) => (
  compact ? renderCompact(property) : renderList(property)
);

export default ValueList;
