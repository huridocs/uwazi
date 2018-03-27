import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip, Legend } from 'recharts';

import ExtendedTooltip from './ExtendedTooltip';
import ColoredBar from './ColoredBar';
import colorScheme from '../utils/colorScheme';

const StackedDualBarChart = (props) => {
  const { data, chartLabel } = props;
  const legendPayload = data.map((item, index) => ({
    value: item.name,
    type: 'rect',
    color: colorScheme[index % colorScheme.length],
    formatter: () => <span style={{ color: '#333' }}>{item.name}</span>
  }));

  return (
    <ResponsiveContainer height={320}>
      <BarChart height={300} data={data} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="xAxisName" label=""/>
        <YAxis/>
        <CartesianGrid strokeDasharray="2 4"/>
        <Tooltip content={<ExtendedTooltip parentData={data} chartLabel={chartLabel} />}/>
        <Bar dataKey="setAValue" fill="#D24040" shape={<ColoredBar />} stackId="unique" />
        <Bar dataKey="setBValue" fill="#D24040" shape={<ColoredBar color="light" />} stackId="unique" />
        <Legend payload={legendPayload} />
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
  chartLabel: PropTypes.string
};

export default StackedDualBarChart;
