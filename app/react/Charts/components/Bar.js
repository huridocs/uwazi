import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip, Rectangle, Legend } from 'recharts';

import { formatPayload } from '../utils/arrayUtils';

import colorScheme from '../utils/colorScheme';

class ExtendedTooltip extends React.Component {
  render() {
    if (this.props.active) {
      return (
        <div style={{ backgroundColor: '#fff', border: '1px solid #ccc' }}>
          <div style={{ backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px' }}>
            {this.props.chartLabel}
          </div>
          <div style={{ padding: '5px' }}>
            {this.props.payload[0].payload.name}:&nbsp;&nbsp;<b style={{ color: '#600' }}>{this.props.payload[0].value}</b>
          </div>
        </div>
      );
    }
    return null;
  }
}

ExtendedTooltip.propTypes = {
  payload: PropTypes.array,
  active: PropTypes.bool,
  chartLabel: PropTypes.string
};

const ColoredBar = (props) => {
  const { index } = props;
  return <Rectangle {...props} stroke="none" fill={colorScheme[index % colorScheme.length]}/>;
};

ColoredBar.propTypes = {
  fill: PropTypes.string,
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  index: PropTypes.number
};

export class RechartsBar extends Component {
  componentWillMount() {
    this.mountData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.mountData(nextProps);
    }
  }

  mountData(props) {
    let fullData = [];

    if (props.data) {
      fullData = props.data.map(item => ({ name: item.label, value: item.results, xAxisName: '' }));
    }
    this.setState({ fullData });
  }

  render() {
    return (
      <ResponsiveContainer height={320}>
        <BarChart
          height={300}
          data={this.state.fullData}
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="xAxisName" label={this.props.chartLabel}/>
          <YAxis/>
          <CartesianGrid strokeDasharray="2 4"/>
          <Tooltip content={<ExtendedTooltip parentData={this.state.fullData} chartLabel={this.props.chartLabel} />}/>
          <Bar dataKey="value" fill="#D24040" shape={<ColoredBar />} />
          <Legend payload={formatPayload(this.state.fullData)} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
}

RechartsBar.propTypes = {
  data: PropTypes.array,
  chartLabel: PropTypes.string
};

export default connect()(RechartsBar);
