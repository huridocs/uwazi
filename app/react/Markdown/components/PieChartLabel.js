import React from 'react';
import PropTypes from 'prop-types';

const PieChartLabel = props => {
  const { data, cx, cy, midAngle, innerRadius, outerRadius, value, index } = props;

  const RADIAN = Math.PI / 180;
  const radius = 25 + innerRadius + (outerRadius - innerRadius);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#8884d8"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {data[index].label} ({value})
    </text>
  );
};

PieChartLabel.defaultProps = {
  cx: 0,
  cy: 0,
  value: 0,
  innerRadius: 0,
  outerRadius: 0,
  midAngle: 0,
  index: 0,
};

PieChartLabel.propTypes = {
  cx: PropTypes.number,
  cy: PropTypes.number,
  innerRadius: PropTypes.number,
  outerRadius: PropTypes.number,
  midAngle: PropTypes.number,
  value: PropTypes.number,
  index: PropTypes.number,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
    })
  ).isRequired,
};

export default PieChartLabel;
