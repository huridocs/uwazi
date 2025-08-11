import React from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Tooltip,
  Legend,
} from 'recharts';

import arrayUtils from '../utils/arrayUtils';

import ExtendedTooltip from './ExtendedTooltip';
import ColoredBar from './ColoredBar';

const StackedDualBarChart = props => {
  const { data, chartLabel } = props;
  return (
    <ResponsiveContainer height={320}>
      <BarChart height={300} data={data} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" />
        <XAxis dataKey="xAxisName" label="" />
        <YAxis />
        <Bar dataKey="setAValue" shape={<ColoredBar />} stackId="unique" />
        <Bar dataKey="setBValue" shape={<ColoredBar color="light" />} stackId="unique" />
        <Tooltip content={<ExtendedTooltip parentData={data} chartLabel={chartLabel} />} />
        <Legend payload={arrayUtils.formatPayload(data)} />
      </BarChart>
    </ResponsiveContainer>
  );
};

StackedDualBarChart.defaultProps = {
  data: [],
  chartLabel: null,
};

StackedDualBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  chartLabel: PropTypes.string,
};

export default StackedDualBarChart;
