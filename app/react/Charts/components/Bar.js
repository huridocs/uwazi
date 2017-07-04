import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip} from 'recharts';

class ExtendedTooltip extends React.Component {
  render() {
    if (this.props.active) {
      return (
        <div style={{backgroundColor: '#fff', border: '1px solid #ccc'}}>
          <div style={{backgroundColor: '#eee', borderBottom: '1px dashed #ccc', padding: '5px'}}>
            {this.props.chartLabel}
          </div>
          <div style={{padding: '5px'}}>
            {this.props.payload[0].payload.name}:&nbsp;&nbsp;<b style={{color: '#600'}}>{this.props.payload[0].value}</b>
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
        return {name: item.label, value: item.results, xAxisName: ''};
      });
    }
    this.setState({activeIndex: 0, fullData});
  }

  render() {
    return (
      <ResponsiveContainer height={300}>
        <BarChart height={300} data={this.state.fullData}
                  margin={{top: 5, right: 30, left: 20, bottom: 25}}>
          <XAxis dataKey="xAxisName" label={this.props.chartLabel}/>
          <YAxis/>
          <CartesianGrid strokeDasharray="2 4"/>
          <Tooltip content={<ExtendedTooltip parentData={this.state.fullData} chartLabel={this.props.chartLabel} />}/>
          <Bar dataKey="value" fill="#D24040" />
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
