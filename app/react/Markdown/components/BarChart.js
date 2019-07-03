import React from 'react';
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
  Tooltip
} from 'recharts';

import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import markdownDatasets from '../markdownDatasets';

//eslint-disable-next-line
const X = ({ layout }) => {
  if (layout === 'vertical') {
    return <XAxis type="number" dataKey="results" />;
  }
  return <XAxis dataKey="label" label="" />;
};

//eslint-disable-next-line
const Y = ({ layout }) => {
  if (layout === 'vertical') {
    return <YAxis width={200} type="category" dataKey="label" />;
  }
  return <YAxis />;
};

export const BarChartComponent = (props) => {
  const { maxCategories, layout, property, data, classname, context, thesauris } = props;
  let output = <Loader />;

  if (data) {
    const formattedData = arrayUtils.sortValues(
      arrayUtils.formatDataForChart(data, property, thesauris, { context, maxCategories })
    );

    output = (
      <ResponsiveContainer height={320}>
        <BarChart
          height={300}
          data={formattedData}
          layout={layout}
        >
          {X({ layout })}
          {Y({ layout })}

          <CartesianGrid strokeDasharray="2 4" />
          <Tooltip />
          <Bar dataKey="results" fill="rgb(30, 28, 138)" stackId="unique" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`BarChart ${classname}`}>{output}</div>;
};

BarChartComponent.defaultProps = {
  context: 'System',
  layout: 'horizontal',
  maxCategories: '0',
  classname: '',
  data: null
};

BarChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  classname: PropTypes.string,
  layout: PropTypes.string,
  maxCategories: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List)
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris
});

export default connect(mapStateToProps)(BarChartComponent);
