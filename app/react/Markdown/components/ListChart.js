import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import rison from 'rison';
import queryString from 'query-string';

import { t } from 'app/I18N';
import { populateOptions } from 'app/Library/helpers/libraryFilters';
import Loader from 'app/components/Elements/Loader';
import { arrayUtils } from 'app/Charts';
import MarkdownLink from './MarkdownLink';
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

    return { key: item.key, label: t(context, label.label, null, false), results: item.filtered.doc_count };
  })
  .filter(i => !!i);
};

export const ListChartComponent = (props) => {
  const { property, data, classname, context, colors, thesauris } = props;
  const sliceColors = colors.split(',');

  let output = <Loader/>;

  if (data) {
    const formattedData = arrayUtils.sortValues(formatData(data, property, context, thesauris));
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
              <div className="list-bullet" style={{ backgroundColor: sliceColors[index % sliceColors.length] }}>
                <span>{item.results}</span>
              </div>
              <span className="list-label">{item.label}</span>
            </div>
          );

          query.filters[property] = { values: [item.key] };

          return (
            <li key={item.key}>
              {props.baseUrl && <MarkdownLink url={`/library/?q=${rison.encode(query)}`} classname="list-link">{Content}</MarkdownLink>}
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
};

export const mapStateToProps = (state, props) => ({
  data: markdownDatasets.getAggregations(state, props),
  thesauris: state.thesauris,
});

export default connect(mapStateToProps)(ListChartComponent);
