import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import rison from 'rison-node';
import qs from 'qs';

import { Loader } from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import MarkdownLink from './MarkdownLink';
import markdownDatasets from '../markdownDatasets';

export const ListChartComponent = props => {
  const { excludeZero, property, data, classname, context, scatter, colors } = props;
  const sliceColors = colors.split(',');

  let output = <Loader />;

  if (data) {
    const formattedData = arrayUtils.sortValues(
      arrayUtils.formatDataForChart(data, property, {
        excludeZero: Boolean(excludeZero),
        context,
        scatter,
      })
    );
    let query = { filters: {} };

    if (props.baseUrl) {
      const { q } = qs.parse(props.baseUrl.substring(props.baseUrl.indexOf('?')), {
        ignoreQueryPrefix: true,
      });
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
              <span className="list-label">
                {scatter ? `${item.parent} - ${item.label}` : item.label}
              </span>
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
  scatter: false,
  classname: '',
  colors: '#ffcc00,#ffd633,#ffe066,#ffeb99,#fff5cc',
  data: null,
  baseUrl: null,
};

ListChartComponent.propTypes = {
  property: PropTypes.string.isRequired,
  context: PropTypes.string,
  scatter: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
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
