import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import Helmet from 'react-helmet';
import ItemList from '../../Markdown/components/ItemList';
import ResultsSidePanel from './ResultsSidePanel';


const countSentencesAboveThreshold = (doc, threshold) =>
  doc.semanticSearch.results.findIndex(({ score }) => score < threshold); // use findIndex cause array is sorted by score

const filterItems = (items, { threshold, minRelevantSentences }) => {
  const filteredItems = items.reduce((prev, item) => {
    const aboveThreshold = countSentencesAboveThreshold(item, threshold);
    if (item.semanticSearch.averageScore > threshold && aboveThreshold > minRelevantSentences) {
      return prev.concat([item]);
    }
    return prev;
  }, []);
  return filteredItems;
};

export class SemanticSearchResults extends Component {
  render() {
    const { search, filters } = this.props;
    const items = search.results ? filterItems(search.results, filters) : [];
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
              <div>
                { search.searchTerm }
              </div>
              <ItemList items={items} link="" storeKey="library"/>
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
