import React from 'react';

import { I18NLink } from 'app/I18N';

import { Icon } from '../../Layout';

const withIcon = v => (
  v.icon ? <React.Fragment><Icon className="item-icon item-icon-center" data={v.icon} />{v.value}</React.Fragment> : v.value
);

const interpose = (array, separator) => [].concat(...array.map(e => [separator, e])).slice(1);

const renderList = prop => (
  <ul className="multiline">
    {prop.value.map((v) => {
      const key = prop.label + v.value;
      if (v.url) {
        return <li key={key}><I18NLink to={v.url}>{withIcon(v)}</I18NLink></li>;
      }
      return <li key={key}>{withIcon(v)}</li>;
    })}
  </ul>
);

const renderCompact = prop => (
  prop.type === 'multidate' || prop.type === 'multidaterange'
    ? interpose(prop.value.map(v => v.value), <br />)
    : interpose(prop.value.map(v => withIcon(v)), ', ')
);

const ValueList = ({ property, compact }) => (
  compact ? renderCompact(property) : renderList(property)
);

export default ValueList;
