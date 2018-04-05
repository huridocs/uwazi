import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import MarkdownViewer from 'app/Markdown';

import { formatMetadata } from '../selectors';

const showByType = (prop) => {
  if (prop.type === 'markdown') {
    return <MarkdownViewer markdown={prop.value} />;
  }

  if (prop.value.map) {
    return prop.value.map(v => v.value).join(', ');
  }

  return prop.value;
};

const Metadata = ({ metadata }) => {
  return (
    <React.Fragment>
      {metadata.map(prop => (
        <dl key={prop.label}>
          <dt>{prop.label}</dt>
          <dd>{showByType(prop)}</dd>
        </dl>
      ))}
    </React.Fragment>
  );
};

Metadata.propTypes = {
  metadata: PropTypes.array
};

export function mapStateToProps(state, { entity }) {
  return {
    metadata: formatMetadata(state, entity)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Metadata);
