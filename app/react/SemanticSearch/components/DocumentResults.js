import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Form, Field } from 'react-redux-form';
import Immutable from 'immutable';

import { t } from 'app/I18N';
import SnippetList from 'app/Documents/components/SnippetList';
import { selectSnippet } from 'app/Viewer/actions/uiActions';

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

export function DocumentResults({ doc, filters, selectSnippet }) {
  console.log('RES', doc, filters);
  const { aboveThreshold, avgThreshold } = doc.semanticSearch ? processItem(doc, filters.threshold) : { aboveThreshold: 0, avgThreshold: 0 };
  let snippets = Immutable.fromJS({
    count: 0,
    metadata: [],
    fullText: [
      { page: 1, text: 'test' }
    ]
  });
  if (doc.semanticSearch) {
    snippets = Immutable.fromJS({
      count: aboveThreshold,
      metadata: [],
      fullText: doc.semanticSearch.results.map(result => ({
        page: result.page,
        text: result.sentence
      }))
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
          <dd>{ avgThreshold }</dd>
        </dl>
        <dl>
          <dt>Evidence sentences</dt>
        </dl>
        <SnippetList
          doc={Immutable.fromJS(doc)}
          documentViewUrl={documentViewUrl}
          snippets={snippets}
          searchTerm=""
          selectSnippet={selectSnippet}
        />
      </div>
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
