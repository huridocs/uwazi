/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Tooltip,
  Cell,
} from 'recharts';

import Loader from 'app/components/Elements/Loader';

const X = ({ layout, dataKey }) =>
  layout === 'vertical' ? (
    <XAxis type="number" dataKey={dataKey} />
  ) : (
    <XAxis dataKey="label" label="" />
  );

const Y = ({ layout }) =>
  layout === 'vertical' ? <YAxis width={200} type="category" dataKey="label" /> : <YAxis />;

const propTypesY = {
  layout: PropTypes.string.isRequired,
};

const propTypesX = {
  ...propTypesY,
  dataKey: PropTypes.string.isRequired,
};

X.propTypes = propTypesX;
Y.propTypes = propTypesY;

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    const finalItemStyle = {
      display: 'block',
      color: '#999',
      backgroundColor: 'rgba(255,255,255,0.9)',
      border: '1px solid #ccc',
      padding: '10px',
    };
    return (
      <div className="custom-tooltip" style={finalItemStyle}>
        <p className="tooltip-label" style={{ margin: 0 }}>
          {label} :{' '}
          <span className="tooltip-label-value" style={{ color: payload[0].color || '#000' }}>
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }

  return null;
};

CustomTooltip.defaultProps = {
  active: false,
  label: undefined,
  payload: undefined,
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.instanceOf(Object),
  label: PropTypes.string,
};

class SimpleBarChart extends Component {
  constructor(props) {
    super(props);
    this.state = { activeDataIndex: 0 };
    this.changeData = this.changeData.bind(this);
  }

  getDataKeys() {
    const { dataKeys } = this.props;
    if (dataKeys.indexOf('[') === 0) {
      return JSON.parse(dataKeys);
    }

    return [{ [dataKeys]: dataKeys }];
  }

  changeData(activeDataIndex) {
    return () => {
      this.setState({ activeDataIndex });
    };
  }

  render() {
    const { activeDataIndex } = this.state;
    const { layout, data, dataKeys, classname, colors, children } = this.props;
    let output = <Loader />;

    if (data) {
      const sliceColors = colors.split(',');
      const parsedData = JSON.parse(data);
      const dataKeysArray = this.getDataKeys(dataKeys);
      const dataKey = Object.keys(dataKeysArray[activeDataIndex])[0];
      output = (
        <React.Fragment>
          {dataKeysArray.length > 1 && (
            <div className="toggle-group">
              {dataKeysArray.map((dataKeyValue, index) => {
                return (
                  <button
                    type="button"
                    className={`btn ${
                      activeDataIndex === index ? 'btn-primary' : 'btn-default'
                    } toggle-group-button`}
                    key={Object.keys(dataKeyValue)[0]}
                    onClick={this.changeData(index)}
                  >
                    {Object.values(dataKeyValue)[0]}
                  </button>
                );
              })}
            </div>
          )}
          {children}
          <ResponsiveContainer height={320}>
            <BarChart height={300} data={parsedData} layout={layout}>
              {X({ layout, dataKey })}
              {Y({ layout, dataKey })}
              <CartesianGrid strokeDasharray="2 4" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill="rgb(30, 28, 138)" stackId="unique">
                {parsedData.map((entry, index) => (
                  <Cell
                    cursor="pointer"
                    fill={sliceColors[index % sliceColors.length]}
                    key={`cell-${index}`} // eslint-disable-line react/no-array-index-key
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </React.Fragment>
      );
    }

    return <div className={`BarChart ${classname}`}>{output}</div>;
  }
}

SimpleBarChart.defaultProps = {
  layout: 'horizontal',
  classname: '',
  data: null,
  dataKeys: 'results',
  colors: '#1e1c8a',
  children: null,
};

SimpleBarChart.propTypes = {
  classname: PropTypes.string,
  layout: PropTypes.string,
  data: PropTypes.string,
  dataKeys: PropTypes.string,
  colors: PropTypes.string,
  children: PropTypes.node,
};

export default SimpleBarChart;
