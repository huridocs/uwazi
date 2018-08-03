import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

export const PieChartComponent = (props) => {
  const { property, data, classname, context, colors, thesauris } = props;
  let output = <Loader/>;

  if (data) {
    const formattedData = arrayUtils.sortValues(formatData(data, property, context, thesauris));
    const sliceColors = colors.split(',');
    output = (
      <ResponsiveContainer width="100%" height={222}>
        <PieChart width={222} height={222} >
          <Pie
            data={formattedData}
            dataKey="results"
            nameKey="label"
            labelLine={false}
            outerRadius={105}
            fill="#8884d8"
          >
            {
              formattedData.map((entry, index) => <Cell key={index} fill={sliceColors[index % sliceColors.length]} />)
            }
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return <div className={`PieChart ${classname}`}>{output}</div>;
};

PieChartComponent.defaultProps = {
  context: 'System',
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
};

PieChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  classname: PropTypes.string,
  colors: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(PieChartComponent);
