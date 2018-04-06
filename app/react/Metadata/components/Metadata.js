import PropTypes from 'prop-types';
import React from 'react';

import { t, I18NLink } from 'app/I18N';
import MarkdownViewer from 'app/Markdown';

import ValueList from './ValueList';

const showByType = (prop, compact) => {
  if (prop.type === null) {
    return t('System', 'No property');
  }

  if (prop.type === 'markdown') {
    return <MarkdownViewer markdown={prop.value} />;
  }

  if (prop.url) {
    return <I18NLink to={prop.url}>{prop.value}</I18NLink>;
  }

  if (prop.value.map) {
    return <ValueList compact={compact} property={prop} />;
  }

  return prop.value;
};

const Metadata = ({ metadata, compact }) => (
  <React.Fragment>
    {metadata.filter(p => p.value || p.type === null).map(prop => (
      <dl key={prop.label}>
        <dt>{t(prop.translateContext, prop.label)}</dt>
        <dd className={prop.sortedBy ? 'item-current-sort' : ''}>
          {showByType(prop, compact)}
        </dd>
      </dl>
    ))}
  </React.Fragment>
);

Metadata.defaultProps = {
  compact: false
};

Metadata.propTypes = {
  metadata: PropTypes.array,
  compact: PropTypes.bool
};

export default Metadata;
