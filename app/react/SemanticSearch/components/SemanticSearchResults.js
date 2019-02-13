import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Map } from 'immutable';

import Helmet from 'react-helmet';
import SidePanel from 'app/Layout/SidePanel';
import { RowList } from 'app/Layout/Lists';
import ItemList from '../../Markdown/components/ItemList';

import ResultItem from './ResultItem';
import ResultsSidePanel from './ResultsSidePanel';

const renderItems = (items, props) => {
  return items.map(result => (
    <ResultItem result={result} key={result.sharedId} />
  ));
};

const processItem = (result, threshold) => {
  const [aboveThreshold, totalThreshold] = result.results
  .reduce(([aboveThresh, totalThresh], r) => (
    [
      aboveThresh + (r.score > threshold ? 1 : 0),
      totalThresh + r.score
    ]), [0, 0]);
  const avgThreshold = totalThreshold / result.results.length;
  return { aboveThreshold, avgThreshold };
};

const processItems = (items, { threshold, minRelevantSentences }) => {
  const processedItems = items.reduce((prev, item) => {
    const itemStats = processItem(item, threshold);
    if (itemStats.avgThreshold > threshold && itemStats.aboveThreshold > minRelevantSentences) {
      return prev.concat([item]);
    }
    return prev;
  }, []);
  return processedItems;
};

export class SemanticSearchResults extends Component {
  render() {
    const { search, filters } = this.props;
    const items = processItems(search.get('results').toJS(), filters);
    return (
      <div className="row panels-layout">
        { search.isEmpty() &&
          <React.Fragment>
            <p>Search not found</p>
            <Helmet title="Semantic search not found" />
          </React.Fragment>
        }
        { !search.isEmpty() &&
          <React.Fragment>
            <Helmet title={`${search.get('searchTerm')} - Semantic search results`} />
            <main className="semantic-search-results-viewer document-viewer with-panel">
              <RowList>
                {items.map(result => (
                  <ResultItem result={result} key={result.sharedId} />
                ))}
              </RowList>
              {/* <ItemList items={search.get('results').toJS()} renderItems={renderItems} /> */}
            </main>
            <ResultsSidePanel />
          </React.Fragment>
        }
      </div>
    );
  }
}

SemanticSearchResults.propTypes = {
  search: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  search: state.semanticSearch.search,
  filters: state.library.semanticSearch.resultsFilters
});

export default connect(mapStateToProps)(SemanticSearchResults);
