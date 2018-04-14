import PropTypes from 'prop-types';
import React from 'react';

import { t, I18NLink } from 'app/I18N';
import MarkdownViewer from 'app/Markdown';

import ValueList from './ValueList';

const showByType = (prop, compact) => {
  let result = prop.value;
  if (prop.type === null) {
    result = t('System', 'No property');
  }

  if (prop.type === 'markdown') {
    result = <MarkdownViewer markdown={prop.value} />;
  }

  if (prop.url) {
    result = <I18NLink to={prop.url}>{prop.value}</I18NLink>;
  }

  if (prop.value && prop.value.map) {
    result = <ValueList compact={compact} property={prop} />;
  }

  return result;
};

const removeEmptyValues = (p) => {
  if (Array.isArray(p.value)) {
    return p.value.length;
  }
  return p.value || p.type === null;
};

const Metadata = ({ metadata, compact }) => (
  <React.Fragment>
    {metadata.filter(removeEmptyValues).map(prop => (
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
  metadata: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.instanceOf(Object),
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string
      }))
    ])
  })).isRequired,
  compact: PropTypes.bool
};

export default Metadata;
