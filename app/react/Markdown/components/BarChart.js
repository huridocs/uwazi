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

import { t } from 'app/I18N';
import { populateOptions } from 'app/Library/helpers/libraryFilters';
import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
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

export const BarChartComponent = (props) => {
  const { maxCategories, layout, property, data, classname, context, thesauris } = props;
  let output = <Loader />;

  if (data) {
    const formattedData = arrayUtils.sortValues(
      formatData(data, property, context, thesauris, maxCategories)
    );

    let X = <XAxis dataKey="label" label="" />;
    let Y = <YAxis />;

    if (layout === 'vertical') {
      X = <XAxis type="number" dataKey="results" />;
      Y = <YAxis width={200} type="category" dataKey="label" />;
    }

    output = (
      <ResponsiveContainer height={320}>
        <BarChart
          height={300}
          data={formattedData}
          layout={layout}
        >
          {X}
          {Y}
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
