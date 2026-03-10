import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

import { Loader } from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import PieChartLabel from './PieChartLabel';
import markdownDatasets from '../markdownDatasets';

const formatData = (data, property, options) => {
  let formattedData = arrayUtils.sortValues(arrayUtils.formatDataForChart(data, property, options));

  if (options.scatter) {
    formattedData = formattedData.map(value => ({
      id: value.id,
      label: `${value.parent} - ${value.label}`,
      results: value.results,
    }));
  }

  return formattedData;
};

export const PieChartComponent = props => {
  const {
    showLabel,
    outerRadius,
    innerRadius,
    property,
    data,
    classname,
    context,
    scatter,
    colors,
    maxCategories,
    pluckCategories,
  } = props;

  let output = <Loader />;

  if (data) {
    const aggregateOthers = props.aggregateOthers === 'true';

    const formattedData = formatData(data, property, {
      context,
      scatter,
      excludeZero: true,
      maxCategories,
      aggregateOthers,
      pluckCategories: JSON.parse(pluckCategories),
    });

    const sliceColors = colors.split(',');
    const shouldShowLabel = showLabel === 'true';
    output = (
      <ResponsiveContainer width="100%" height={222}>
        <PieChart width={222} height={222}>
          <Pie
            data={formattedData}
            dataKey="results"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            labelLine={shouldShowLabel}
            label={shouldShowLabel ? <PieChartLabel data={formattedData} /> : undefined}
          >
            {formattedData.map((_entry, index) => (
              <Cell key={index} fill={sliceColors[index % sliceColors.length]} />
            ))}
          </Pie>
          {!shouldShowLabel && <Tooltip />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`PieChart ${classname}`}>{output}</div>;
};

PieChartComponent.defaultProps = {
  context: 'System',
  scatter: false,
  innerRadius: '0',
  outerRadius: '105',
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  showLabel: 'false',
  aggregateOthers: 'false',
  maxCategories: '0',
  pluckCategories: '[]',
};

PieChartComponent.propTypes = {
  innerRadius: PropTypes.string,
  outerRadius: PropTypes.string,
  maxCategories: PropTypes.string,
  aggregateOthers: PropTypes.string,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  scatter: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  classname: PropTypes.string,
  colors: PropTypes.string,
  showLabel: PropTypes.string,
  pluckCategories: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(PieChartComponent);
