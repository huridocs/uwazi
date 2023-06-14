import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

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

import { Loader } from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import markdownDatasets from '../markdownDatasets';

const objectFlip = obj => {
  const flip = {};
  Object.keys(obj).forEach(key => {
    flip[obj[key]] = key;
  });
  return flip;
};

class BarChartComponent extends Component {
  parseAttributes() {
    const shortLabels = JSON.parse(this.props.shortLabels);
    const sort = JSON.parse(this.props.sort);
    const pluckCategories = JSON.parse(this.props.pluckCategories);
    return { sort, shortLabels, pluckCategories };
  }

  X() {
    if (this.props.layout === 'vertical') {
      return <XAxis type="number" dataKey="results" />;
    }
    return <XAxis dataKey="label" label="" />;
  }

  Y() {
    if (this.props.layout === 'vertical') {
      return <YAxis width={200} type="category" dataKey="label" />;
    }
    return <YAxis />;
  }

  render() {
    const {
      excludeZero,
      maxCategories,
      layout,
      property,
      data,
      classname,
      context,
      scatter,
      colors,
    } = this.props;
    let output = <Loader />;

    if (data) {
      const sliceColors = colors.split(',');
      const aggregateOthers = this.props.aggregateOthers === 'true';
      const { sort, shortLabels, pluckCategories } = this.parseAttributes();
      const shortLabelsFlipped = objectFlip(shortLabels);

      const formattedData = arrayUtils.formatDataForChart(data, property, {
        excludeZero: Boolean(excludeZero),
        context,
        scatter: Boolean(scatter),
        maxCategories,
        aggregateOthers,
        pluckCategories,
        sort,
        labelsMap: shortLabels,
      });

      output = (
        <ResponsiveContainer height={320}>
          <BarChart height={300} data={formattedData} layout={layout}>
            {this.X()}
            {this.Y()}

            <CartesianGrid strokeDasharray="2 4" />
            <Tooltip
              formatter={(value, _name, props) => {
                if (scatter) {
                  const { parent } = props.payload;
                  return shortLabelsFlipped[value] || [value, `\r\n${parent}`];
                }
                return shortLabelsFlipped[value] || value;
              }}
            />
            <Bar dataKey="results" fill="rgb(30, 28, 138)" stackId="unique">
              {formattedData.map((_entry, index) => (
                <Cell
                  // eslint-disable-next-line react/no-array-index-key
                  key={`cell-${index}`}
                  cursor="pointer"
                  fill={sliceColors[index % sliceColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return <div className={`BarChart ${classname}`}>{output}</div>;
  }
}

BarChartComponent.defaultProps = {
  context: 'System',
  scatter: false,
  excludeZero: false,
  layout: 'horizontal',
  maxCategories: '0',
  aggregateOthers: 'false',
  classname: '',
  data: null,
  colors: '#1e1c8a',
  shortLabels: '{}',
  sort: '{}',
  pluckCategories: '[]',
};

BarChartComponent.propTypes = {
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  scatter: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  excludeZero: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  classname: PropTypes.string,
  layout: PropTypes.string,
  maxCategories: PropTypes.string,
  aggregateOthers: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
  colors: PropTypes.string,
  shortLabels: PropTypes.string,
  sort: PropTypes.string,
  pluckCategories: PropTypes.string,
};

export const mapStateToProps = (state, props) => ({
  data: props.data || markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(BarChartComponent);
