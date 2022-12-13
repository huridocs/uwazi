import React, { Component } from 'react';

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Bar } from './Bar';

type layoutType = 'horizontal' | 'vertical' | undefined;

type XProps = {
  layout: layoutType;
  dataKey: string;
};

type YProps = { layout: layoutType };

const X = ({ layout, dataKey }: XProps) =>
  layout === 'vertical' ? (
    <XAxis type="number" dataKey={dataKey} />
  ) : (
    <XAxis dataKey="label" label="" />
  );

const Y = ({ layout }: YProps) =>
  layout === 'vertical' ? <YAxis width={200} type="category" dataKey="label" /> : <YAxis />;

export type CustomTooltipProps = {
  active: boolean;
  payload?: any[];
  label?: string;
};

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload[0]) {
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
};

export type FreeBarChartProps = {
  classname: string;
  layout: layoutType;
  data: string | null;
  dataKeys: string;
  colors: string;
  children: any;
};

type FreeBarChartState = {
  activeDataIndex: number;
};

class FreeBarChart extends Component<FreeBarChartProps, FreeBarChartState> {
  static defaultProps: Partial<FreeBarChartProps>;

  constructor(props: FreeBarChartProps) {
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

  changeData(activeDataIndex: number) {
    return () => {
      this.setState({ activeDataIndex });
    };
  }

  render() {
    const { activeDataIndex } = this.state;
    const { layout, data, classname, colors, children } = this.props;
    let output = null;

    if (data) {
      const sliceColors = colors.split(',');
      const parsedData = JSON.parse(data);
      const dataKeysArray = this.getDataKeys();
      const dataKey = Object.keys(dataKeysArray[activeDataIndex])[0];
      output = (
        <>
          {dataKeysArray.length > 1 && (
            <div className="toggle-group">
              {dataKeysArray.map((dataKeyValue: object, index: number) => (
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
              ))}
            </div>
          )}
          {children}
          <ResponsiveContainer height={320}>
            <BarChart height={300} data={parsedData} layout={layout}>
              {X({ layout, dataKey })}
              {Y({ layout })}
              <CartesianGrid strokeDasharray="2 4" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill="rgb(30, 28, 138)" stackId="unique">
                {parsedData.map((_entry: any, index: number) => (
                  <Cell
                    cursor="pointer"
                    fill={sliceColors[index % sliceColors.length]}
                    key={`cell-${index}`} // eslint-disable-line react/no-array-index-key
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      );
    }

    return <div className={`BarChart ${classname}`}>{output}</div>;
  }
}

FreeBarChart.defaultProps = {
  classname: '',
  layout: 'horizontal',
  data: null,
  dataKeys: 'results',
  colors: '#1e1c8a',
  children: null,
};

export default FreeBarChart;
