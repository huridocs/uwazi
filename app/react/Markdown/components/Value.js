import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import markdownDatasets from '../markdownDatasets';

export const ValueComponent = ({ value }) => value;

ValueComponent.defaultProps = {
  value: '-',
};

ValueComponent.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),
};

export const mapStateToProps = (state, props) => ({
  value: markdownDatasets.getMetadataValue(state, props)
});

export default connect(mapStateToProps)(ValueComponent);
