import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { t } from 'app/I18N';
import MarkdownViewer from 'app/Markdown';

import { formatMetadata } from '../selectors';

const showByType = (prop) => {
  if (prop.type === 'markdown') {
    return <MarkdownViewer markdown={prop.value} />;
  }

  if (prop.type === null) {
    return t('System', 'No property');
  }

  if (prop.value.map) {
    return prop.value.map(v => v.value).join(', ');
  }

  return prop.value;
};

const Metadata = ({ metadata }) => (
  <React.Fragment>
    {metadata.map(prop => (
      <dl key={prop.label}>
        <dt>{t(prop.translateContext, prop.label)}</dt>
        <dd className={prop.sortedBy ? 'item-current-sort' : ''}>
          {showByType(prop)}
        </dd>
      </dl>
      ))}
  </React.Fragment>
);

Metadata.propTypes = {
  metadata: PropTypes.array
};

export function mapStateToProps(state, { entity, sortedProperty }) {
  return {
    metadata: formatMetadata(state, entity, sortedProperty)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Metadata);
