import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip } from 'recharts';

import { t } from 'app/I18N';
import { populateOptions } from 'app/Library/helpers/libraryFilters';
import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import markdownDatasets from '../markdownDatasets';

const formatData = (data, property, context, thesauris) => {
  const { options } = populateOptions([{ content: context }], thesauris.toJS())[0];

  return data.toJS()
  .filter(i => i.key !== 'missing')
  .map((item) => {
    const label = options.find(o => o.id === item.key);
    if (!label) {
      return null;
    }

    return { label: t(context, label.label, null, false), results: item.filtered.doc_count };
  })
  .filter(i => !!i);
};

export const BarChartComponent = (props) => {
  const { property, data, classname, context, thesauris } = props;
  let output = <Loader/>;

  if (data) {
    const formattedData = arrayUtils.sortValues(formatData(data, property, context, thesauris));
    output = (
      <ResponsiveContainer height={320}>
        <BarChart height={300} data={formattedData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" label="" />
          <YAxis/>
          <CartesianGrid strokeDasharray="2 4"/>
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
  classname: '',
  data: null,
};

BarChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  classname: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(BarChartComponent);
