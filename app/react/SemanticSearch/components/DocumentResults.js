import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Field } from 'react-redux-form';
import Immutable from 'immutable';

import { t } from 'app/I18N';
import SnippetList from 'app/Documents/components/SnippetList';
import { selectSnippet } from 'app/Viewer/actions/uiActions';

const findResultsAboveThreshold = (results, threshold) => {
  const boundingIndex = results.findIndex(({ score }) => score < threshold);
  return results.slice(0, boundingIndex);
};

export function DocumentResults({ doc, filters, selectSnippet }) {
  let snippets = {};
  let avgScore = 0;
  let aboveThreshold = 0;
  if (doc.semanticSearch) {
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, filters.threshold);
    avgScore = doc.semanticSearch.averageScore;
    aboveThreshold = filteredResults.length;
    snippets = Immutable.fromJS({
      count: aboveThreshold,
      metadata: [],
      fullText: filteredResults
    });
  }
  const documentViewUrl = doc.file ?
    `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;
  return (
    <Form model="library.semanticSearch.resultsFilters">
      <div className="view">
        <dl className="metadata-type-text">
          <dt className="item-header">
            {t('System', 'Threshold')}
          </dt>
          <dd>
            <Field model=".threshold" dynamic={false}>
              <input type="range" min="0" max="1" step="0.01"/>
            </Field>
          </dd>
        </dl>
        <dl className="metadata-type-numeric">
          <dt>Sentences above threshold</dt>
          <dd>{ aboveThreshold }</dd>
        </dl>
        <dl className="metadata-type-numeric">
          <dt>Average sentence score</dt>
          <dd>{ avgScore }</dd>
        </dl>
      </div>
      { doc.semanticSearch && <SnippetList
        doc={Immutable.fromJS(doc)}
        documentViewUrl={documentViewUrl}
        snippets={snippets}
        searchTerm=""
        selectSnippet={selectSnippet}
      />}
    </Form>
  );
}

DocumentResults.propTypes = {
  doc: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  selectSnippet: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    filters: state.library.semanticSearch.resultsFilters
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectSnippet }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentResults);
