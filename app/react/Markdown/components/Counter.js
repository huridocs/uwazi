import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import markdownDatasets from '../markdownDatasets';

const CounterComponent = ({ count }) => count;

CounterComponent.defaultProps = {
  count: '-',
};

CounterComponent.propTypes = {
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export const mapStateToProps = (state, props) => ({
  count: markdownDatasets.getAggregation(state, props),
});

export default connect(mapStateToProps)(CounterComponent);
