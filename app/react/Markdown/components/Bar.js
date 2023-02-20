//TODO: replace react redux form
import PropTypes from 'prop-types';
import { Bar as BarRC } from 'recharts';

class Bar extends BarRC {}

Bar.propTypes = {
  children: PropTypes.node.isRequired,
};

export { Bar };
