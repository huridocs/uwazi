import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { Translate, t } from 'app/I18N';
import SnippetList from 'app/Documents/components/SnippetList';
import { selectSnippet } from 'app/Viewer/actions/uiActions';
import { Form } from 'react-redux-form';
import { NumericRangeSlide } from 'app/ReactReduxForms';
import { Icon } from 'app/Layout/Icon';
import { TemplateLabel, DocumentLanguage } from 'app/Layout';

const findResultsAboveThreshold = (results, threshold) => {
  const boundingIndex = results.findIndex(({ score }) => score < threshold);
  return results.slice(0, boundingIndex);
};

export class DocumentResults extends Component {
  renderSnippetsList(doc, snippets, documentViewUrl) {
    return (
      <SnippetList
        doc={Immutable.fromJS(doc)}
        documentViewUrl={documentViewUrl}
        snippets={snippets}
        searchTerm=""
        selectSnippet={(...args) => { this.props.selectSnippet(...args); }}
      />
    );
  }

  renderFilter() {
    const { threshold } = this.props;
    return (
      <dl className="metadata-type-text">
        <dt className="item-header">
          <Translate>Threshold</Translate> {threshold * 100} %
        </dt>
        <dd>
          <Form model="semanticSearch.resultsFilters">
            <NumericRangeSlide
              model=".threshold"
              min={0.3}
              max={1}
              step={0.01}
              delay={200}
              minLabel={t('System', 'More exploration')}
              maxLabel={t('System', 'More precision')}
            />
          </Form>
        </dd>
      </dl>
    );
  }

  render() {
    const { doc, threshold } = this.props;
    if (!doc.semanticSearch) {
      return false;
    }
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, threshold).sort((a, b) => a.score < b.score);
    const snippetsToRender = doc.semanticSearch.results.map(s => Object.assign(
      {}, s, { text: `${s.text} (${(s.score * 100).toFixed(2)}%)` })
    );
    const snippets = Immutable.fromJS({ count: snippetsToRender.length, metadata: [], fullText: snippetsToRender });
    const documentViewUrl = doc.file ? `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;
    return (
      <React.Fragment>
        <div className="view">
          <div className="item-info">
            <div>
              <Icon className="item-icon item-icon-center" data={doc.icon} />
              <h1 className="item-name">
                {doc.title}
                <DocumentLanguage doc={Immutable.fromJS(doc)} />
              </h1>
            </div>
            <TemplateLabel template={doc.template}/>
          </div>
          {this.renderFilter()}
          <dl className="metadata-type-numeric">
            <dt><Translate>Sentences above threshold</Translate></dt>
            <dd>{ doc.semanticSearch.numRelevant }</dd>
          </dl>
          <dl className="metadata-type-numeric">
            <dt><Translate>% of document above threshold</Translate></dt>
            <dd>{ (doc.semanticSearch.relevantRate * 100).toFixed(2) }%</dd>
          </dl>
        </div>
        {this.renderSnippetsList(doc, snippets, documentViewUrl)}
      </React.Fragment>
    );
  }
}

DocumentResults.propTypes = {
  doc: PropTypes.object.isRequired,
  threshold: PropTypes.number.isRequired,
  selectSnippet: PropTypes.func.isRequired,
};

const mapStateToProps = ({ semanticSearch }) => ({
    threshold: semanticSearch.resultsFilters.threshold
});


function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectSnippet }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentResults);
