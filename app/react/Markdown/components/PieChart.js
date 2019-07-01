import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

import { t } from 'app/I18N';
import { populateOptions } from 'app/Library/helpers/libraryFilters';
import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import PieChartLabel from './PieChartLabel';
import markdownDatasets from '../markdownDatasets';

const formatData = (data, property, context, thesauris, maxCategories) => {
  const { options } = populateOptions([{ content: context }], thesauris.toJS())[0];

  const relevant = data.toJS()
  .filter(i => i.key !== 'missing')
  .filter(i => i.filtered && i.filtered.doc_count !== 0);

  let categories = relevant.sort((a, b) => b.filtered.doc_count - a.filtered.doc_count);

  if (Number(maxCategories)) {
    categories = relevant.slice(0, Number(maxCategories));
    categories[categories.length] = relevant.slice(Number(maxCategories)).reduce((memo, category) => {
      memo.filtered.doc_count += category.filtered.doc_count;
      return memo;
    }, { key: 'others', filtered: { doc_count: 0 } });
  }

  return categories.map((item) => {
    if (item.key === 'others') {
      return { label: 'others', results: item.filtered.doc_count };
    }

    const label = options.find(o => o.id === item.key);
    if (!label) {
      return null;
    }

    return { label: t(context, label.label, null, false), results: item.filtered.doc_count };
  })
  .filter(i => !!i);
};


export const PieChartComponent = (props) => {
  const {
    showLabel,
    outerRadius,
    innerRadius,
    property,
    data,
    classname,
    context,
    colors,
    thesauris,
    maxCategories,
  } = props;

  let output = <Loader/>;

  if (data) {
    const formattedData = arrayUtils.sortValues(formatData(data, property, context, thesauris, maxCategories));
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
            label={shouldShowLabel ? <PieChartLabel data={formattedData}/> : undefined}
          >
            {
              formattedData.map((entry, index) => <Cell key={index} fill={sliceColors[index % sliceColors.length]} />)
            }
          </Pie>
          { !shouldShowLabel && <Tooltip/> }
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`PieChart ${classname}`}>{output}</div>;
};

PieChartComponent.defaultProps = {
  context: 'System',
  innerRadius: '0',
  outerRadius: '105',
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  showLabel: 'false',
  maxCategories: '0',
};

PieChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  innerRadius: PropTypes.string,
  outerRadius: PropTypes.string,
  maxCategories: PropTypes.string,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  classname: PropTypes.string,
  colors: PropTypes.string,
  showLabel: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(PieChartComponent);
