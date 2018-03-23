import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip, Rectangle, Legend} from 'recharts';

import colorScheme, {light as colorSchemeLight} from 'app/Charts/utils/colorScheme';

class ExtendedTooltip extends React.Component {
  render() {
    if (this.props.active) {
      return (
        <div style={{backgroundColor: '#fff', border: '1px solid #ccc'}}>
          <div style={{backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px'}}>
            {this.props.payload[0].payload.name}:&nbsp;&nbsp;
            <b style={{color: '#600'}}>{this.props.payload[0].value + this.props.payload[1].value}</b>
          </div>
          <div style={{padding: '5px'}}>
            {this.props.payload[0].payload.setALabel}:&nbsp;&nbsp;<b style={{color: '#600'}}>{this.props.payload[0].value}</b><br />
            {this.props.payload[1].payload.setBLabel}:&nbsp;&nbsp;<b style={{color: '#600'}}>{this.props.payload[1].value}</b>
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
  const {index, color} = props;
  const colorPallete = color !== 'light' ? colorScheme : colorSchemeLight;
  return <Rectangle {...props} stroke="none" fill={colorPallete[index % colorScheme.length]}/>;
};

ColoredBar.propTypes = {
  color: PropTypes.string,
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
      fullData = props.data.map(item => {
        return {
          name: item.label,
          setALabel: item[`${this.props.setA}Label`],
          setAValue: item[`${this.props.setA}Results`],
          setBLabel: item[`${this.props.setB}Label`],
          setBValue: item[`${this.props.setB}Results`],
          xAxisName: ''};
      });
    }
    console.log('FullData:', fullData);
    this.setState({fullData});
  }

  render() {
    return (
      <ResponsiveContainer height={320}>
        <BarChart height={300} data={this.state.fullData}
                  margin={{top: 0, right: 30, left: 0, bottom: 0}}>
          <XAxis dataKey="xAxisName" label=""/>
          <YAxis/>
          <CartesianGrid strokeDasharray="2 4"/>
          <Tooltip content={<ExtendedTooltip parentData={this.state.fullData} chartLabel={this.props.chartLabel} />}/>
          <Bar dataKey="setAValue" fill="#D24040" shape={<ColoredBar />} stackId="unique" />
          <Bar dataKey="setBValue" fill="#D24040" shape={<ColoredBar color="light" />} stackId="unique" />
          <Legend
                  payload={this.state.fullData.map((item, index) => {
                    return {
                      value: item.name,
                      type: 'rect',
                      color: colorScheme[index % colorScheme.length],
                      formatter: () => <span style={{color: '#333'}}>{item.name}</span>
                    };
                  })}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }
}

RechartsBar.propTypes = {
  data: PropTypes.array,
  chartLabel: PropTypes.string,
  setA: PropTypes.string,
  setB: PropTypes.string
};

export default connect()(RechartsBar);
