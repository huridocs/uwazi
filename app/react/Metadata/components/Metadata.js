import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { formatMetadata } from '../selectors';

const Metadata = ({ metadata }) => {
  console.log(metadata);
  return (
    <React.Fragment>
      {metadata.map(prop => (
        <dl key={prop.label}>
          <dt>{prop.label}</dt>
          <dd>{prop.value}</dd>
        </dl>
      ))}
    </React.Fragment>
  );
};

Metadata.propTypes = {
  metadata: PropTypes.array
};

export function mapStateToProps(state, {entity}) {
  return {
    metadata: formatMetadata(state, entity)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Metadata);
