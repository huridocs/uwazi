/* eslint-disable no-restricted-globals */
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
  return boundingIndex >= 0 ? results.slice(0, boundingIndex) : results;
};

const getSnippetsFromResults = (results, template) => {
  const snippets = results.reduce(
    (_memo, item) => {
      const memo = _memo;
      const text = `${item.text} (${(item.score * 100).toFixed(2)}%)`;
      memo.count += 1;
      if (isNaN(Number(item.page))) {
        const field = template
          .get('properties')
          .find(p => p.get('name') === item.page)
          .get('label');
        memo.metadata[field] = (memo.metadata[field] || []).concat([text]);
        return memo;
      }
      memo.fullText.push({
        page: Number(item.page),
        text,
      });
      return memo;
    },
    { count: 0, metadata: {}, fullText: [] }
  );

  snippets.metadata = Object.keys(snippets.metadata).map(field => ({
    field,
    texts: snippets.metadata[field],
  }));
  return snippets;
};

export class DocumentResults extends Component {
  renderSnippetsList(doc, snippets, documentViewUrl) {
    return (
      <SnippetList
        doc={Immutable.fromJS(doc)}
        documentViewUrl={documentViewUrl}
        snippets={snippets}
        searchTerm=""
        selectSnippet={(...args) => {
          this.props.selectSnippet(...args);
        }}
      />
    );
  }

  renderFilter() {
    const { threshold } = this.props;
    return (
      <dl className="metadata-type-text">
        <dt className="item-header">
          <Translate>Threshold</Translate> {(threshold * 100).toFixed(2)} %
        </dt>
        <dd>
          <Form model="semanticSearch.resultsFilters">
            <NumericRangeSlide
              model=".threshold"
              min={0.3}
              max={1}
              step={0.01}
              delay={200}
              minLabel={t('System', 'Exploration')}
              maxLabel={t('System', 'Precision')}
            />
          </Form>
        </dd>
      </dl>
    );
  }

  render() {
    const { doc, threshold, template } = this.props;

    if (!doc.semanticSearch) {
      return false;
    }
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, threshold);
    const snippets = Immutable.fromJS(getSnippetsFromResults(filteredResults, template));
    const documentViewUrl = doc.file ? `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;

    return (
      <>
        <div className="view">
          <div className="item-info">
            <div>
              <Icon className="item-icon item-icon-center" data={doc.icon} />
              <h1 className="item-name">
                {doc.title}
                <DocumentLanguage doc={Immutable.fromJS(doc)} />
              </h1>
            </div>
            <TemplateLabel template={doc.template} />
          </div>
          {this.renderFilter()}
          <dl className="metadata-type-numeric">
            <dt></dt>
            <dd>{filteredResults.length}</dd>
          </dl>
          <dl className="metadata-type-numeric">
            <dt>
              <Translate>% of sentences above threshold</Translate>
            </dt>
            <dd>
              {((filteredResults.length / doc.semanticSearch.totalResults) * 100).toFixed(2)}%
            </dd>
          </dl>
        </div>
        {this.renderSnippetsList(doc, snippets, documentViewUrl)}
      </>
    );
  }
}

DocumentResults.defaultProps = {
  template: undefined,
};

DocumentResults.propTypes = {
  doc: PropTypes.shape({
    title: PropTypes.string,
    template: PropTypes.string,
    sharedId: PropTypes.string,
    file: PropTypes.object,
    icon: PropTypes.object,
    semanticSearch: PropTypes.shape({
      totalResults: PropTypes.number,
      results: PropTypes.array,
    }),
  }).isRequired,
  threshold: PropTypes.number.isRequired,
  selectSnippet: PropTypes.func.isRequired,
  template: PropTypes.instanceOf(Immutable.Map),
};

const mapStateToProps = ({ semanticSearch, templates }) => ({
  threshold: semanticSearch.resultsFilters.threshold,
  template: templates.find(
    tpl => tpl.get('_id') === semanticSearch.selectedDocument.get('template')
  ),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectSnippet }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentResults);
