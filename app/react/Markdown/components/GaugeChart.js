import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Loader } from 'app/components/Elements/Loader';
import markdownDatasets from '../markdownDatasets';

export const GaugeChartComponent = props => {
  const { dataset, property, value, max, height, classname, colors, children } = props;
  let output = <Loader />;

  const propedChildren = React.Children.map(children, c =>
    React.isValidElement(c) ? React.cloneElement(c, { dataset, property }) : c
  );

  if (value !== null) {
    const formattedData = [
      { label: 'progress', results: value },
      { label: '', results: max - value },
    ];
    const sliceColors = colors.split(',');
    output = (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart width={height * 2} height={height * 2}>
          <Pie
            data={formattedData}
            dataKey="results"
            labelLine={false}
            outerRadius={height}
            innerRadius={Math.floor(height * 0.8)}
            fill="#8884d8"
            startAngle={180}
            endAngle={0}
            cy={height}
          >
            {formattedData.map((_entry, index) => (
              <Cell key={index} fill={sliceColors[index % sliceColors.length]} />
            ))}
          </Pie>
          {propedChildren.length && (
            <g>
              <text
                x="50%"
                y={height}
                dy={-1}
                style={{ fontSize: `${height / 2}px` }}
                textAnchor="middle"
                fill={sliceColors[0]}
              >
                {propedChildren}
              </text>
            </g>
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`GaugeChart ${classname}`}>{output}</div>;
};

GaugeChartComponent.defaultProps = {
  dataset: undefined,
  classname: '',
  colors: '#000099,#ccc',
  value: null,
  children: '',
};

GaugeChartComponent.propTypes = {
  dataset: PropTypes.string,
  property: PropTypes.string.isRequired,
  classname: PropTypes.string,
  colors: PropTypes.string,
  value: PropTypes.number,
  max: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]),
};

export const mapStateToProps = (state, props) => ({
  value: markdownDatasets.getMetadataValue(state, props),
  max: Number(props.max) || 100,
  height: Number(props.height) || 110,
});

export default connect(mapStateToProps)(GaugeChartComponent);
