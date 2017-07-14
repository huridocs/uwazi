import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {ResponsiveContainer, PieChart, Pie, Legend, Cell, Sector} from 'recharts';

import Immutable from 'immutable';

function ellipsisString(string, maxLength) {
  if (string.length <= maxLength) {
    return string;
  }

  return string.substring(0, maxLength - 3) + '...';
}

export class RechartsPie extends Component {

  mountData(props) {
    let fullData = Immutable.fromJS([]);
    if (props.data) {
      fullData = Immutable.fromJS(props.data.map(item => {
        return {name: item.label, value: item.results, enabled: true};
      }));
    }
    this.setState({activeIndex: 0, fullData});
  }

  componentWillMount() {
    this.mountData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps) {
      this.mountData(nextProps);
    }
  }

  renderActiveShape(props) {
    const RADIAN = Math.PI / 180;
    const {cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value} = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 22) * cos;
    const my = cy + (outerRadius + 22) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{ellipsisString(payload.name, 14)}</text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name}: ${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  }

  getFilteredIndex(data, index) {
    let filteredIndexMap = {};
    let enabledIndices = -1;
    data.forEach((item, iterator) => {
      if (item.get('enabled')) {
        enabledIndices += 1;
        filteredIndexMap[iterator] = enabledIndices;
        return;
      }
      filteredIndexMap[iterator] = null;
    });

    return filteredIndexMap[index];
  }

  onIndexEnter(data, index) {
    this.setState({activeIndex: index});
  }

  onFullIndexEnter(data, index) {
    this.onIndexEnter(null, this.getFilteredIndex(this.state.fullData, index));
  }

  onIndexClick(data, index) {
    const oldData = this.state.fullData;
    const enabled = !oldData.getIn([index, 'enabled']);
    let activeIndex = null;
    const fullData = oldData.setIn([index, 'enabled'], enabled);
    if (enabled) {
      activeIndex = this.getFilteredIndex(fullData, index);
    }

    this.setState({activeIndex, fullData});
  }

  render() {
    const fullColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#D24040', '#A250B3'];
    const filteredColors = [];

    const fullData = this.state.fullData.toJS();

    const filteredData = fullData.reduce((results, item, index) => {
      if (item.enabled) {
        results.push(item);
        filteredColors.push(fullColors[index % fullColors.length]);
      }
      return results;
    }, []);

    return (
      <ResponsiveContainer height={320}>
        <PieChart>
          <Pie
              data={filteredData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              activeIndex={this.state.activeIndex}
              activeShape={this.renderActiveShape}
              animationBegin={200}
              animationDuration={500}
              onMouseEnter={this.onIndexEnter.bind(this)}
              onClick={this.onIndexEnter.bind(this)}
              fill="#8884d8">
            {filteredData.map((entry, index) =>
              <Cell key={index} fill={filteredColors[index]} opacity={0.8} />
            )}
          </Pie>
          <Legend
                  onMouseEnter={this.onFullIndexEnter.bind(this)}
                  onClick={this.onIndexClick.bind(this)}
                  payload={fullData.map((item, index) => {
                    return {
                      value: item.name,
                      type: 'rect',
                      color: fullData[index].enabled ? fullColors[index % fullColors.length] : '#aaa',
                      formatter: () => <span style={{color: fullData[index].enabled ? '#333' : '#999'}}>{item.name}</span>
                    };
                  })}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }
}

RechartsPie.propTypes = {
  data: PropTypes.array
};

export default connect()(RechartsPie);
