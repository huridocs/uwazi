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


const processItem = (doc, threshold) => {
  const [aboveThreshold, totalThreshold] = doc.semanticSearch.results
  .reduce(([aboveThresh, totalThresh], r) => (
    [
      aboveThresh + (r.score > threshold ? 1 : 0),
      totalThresh + r.score
    ]), [0, 0]);
  const avgThreshold = totalThreshold / doc.semanticSearch.results.length;
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
    const items = processItems(search.results, filters);
    const isEmpty = Object.keys(search).length === 0;
    return (
      <div className="row panels-layout">
        { isEmpty &&
          <React.Fragment>
            <p>Search not found</p>
            <Helmet title="Semantic search not found" />
          </React.Fragment>
        }
        { !isEmpty &&
          <React.Fragment>
            <Helmet title={`${search.searchTerm} - Semantic search results`} />
            <main className="semantic-search-results-viewer document-viewer with-panel">
              {/* <RowList>
                {items.map(result => (
                  <ResultItem result={result} key={result.sharedId} />
                ))}
              </RowList> */}
              <ItemList items={items} link=""/>
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
  search: state.semanticSearch.search.toJS(),
  filters: state.library.semanticSearch.resultsFilters
});

export default connect(mapStateToProps)(SemanticSearchResults);
