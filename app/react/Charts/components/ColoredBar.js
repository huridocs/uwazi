import React from 'react';
import PropTypes from 'prop-types';
import { Rectangle } from 'recharts';

import colorScheme, { light as colorSchemeLight } from '../utils/colorScheme';

const ColoredBar = (props) => {
  const { index, color } = props;
  const colorPallete = color !== 'light' ? colorScheme : colorSchemeLight;
  return <Rectangle {...props} stroke="none" fill={colorPallete[index % colorScheme.length]}/>;
};

ColoredBar.defaultProps = {
  color: 'default',
  index: 0
};

ColoredBar.propTypes = {
  color: PropTypes.string,
  index: PropTypes.number
};

export default ColoredBar;
