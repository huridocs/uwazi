import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import rison from 'rison';
import queryString from 'query-string';

import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import MarkdownLink from './MarkdownLink';
import markdownDatasets from '../markdownDatasets';

export const ListChartComponent = props => {
  const { excludeZero, property, data, classname, context, colors, thesauris } = props;
  const sliceColors = colors.split(',');

  let output = <Loader />;

  if (data) {
    const formattedData = arrayUtils.sortValues(
      arrayUtils.formatDataForChart(data, property, thesauris, {
        excludeZero: Boolean(excludeZero),
        context,
      })
    );
    let query = { filters: {} };

    if (props.baseUrl) {
      const { q } = queryString.parse(props.baseUrl.substring(props.baseUrl.indexOf('?')));
      query = rison.decode(q);
      query.filters = query.filters || {};
    }

    output = (
      <ul>
        {formattedData.map((item, index) => {
          const Content = (
            <div>
              <div
                className="list-bullet"
                style={{ backgroundColor: sliceColors[index % sliceColors.length] }}
              >
                <span>{item.results}</span>
              </div>
              <span className="list-label">{item.label}</span>
            </div>
          );

          query.filters[property] = { values: [item.id] };

          return (
            <li key={item.id}>
              {props.baseUrl && (
                <MarkdownLink url={`/library/?q=${rison.encode(query)}`} classname="list-link">
                  {Content}
                </MarkdownLink>
              )}
              {!props.baseUrl && Content}
            </li>
          );
        })}
      </ul>
    );
  }

  return <div className={`ListChart ${classname}`}>{output}</div>;
};

ListChartComponent.defaultProps = {
  context: 'System',
  excludeZero: false,
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  baseUrl: null,
};

ListChartComponent.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  classname: PropTypes.string,
  colors: PropTypes.string,
  data: PropTypes.instanceOf(Immutable.List),
  baseUrl: PropTypes.string,
  excludeZero: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(ListChartComponent);
