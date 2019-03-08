import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { Translate } from 'app/I18N';
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
    return (
      <dl className="metadata-type-text">
        <dt className="item-header">
          <Translate>Threshold</Translate> {this.props.threshold * 100} %
        </dt>
        <dd>
          <Form model="semanticSearch.resultsFilters">
            <NumericRangeSlide model=".threshold" min={0.3} max={1} step={0.01} delay={200} />
          </Form>
        </dd>
      </dl>
    );
  }

  render() {
    const { doc } = this.props;
    if (!doc.semanticSearch) {
      return false;
    }
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, this.props.threshold).sort((a, b) => a.score < b.score);
    const snippetsToRender = filteredResults.slice(0, 50).map((s) => {
      return Object.assign({}, s, { text: `${s.text} (${(s.score * 100).toFixed(1)}%)` });
    });
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
            <dd>{ filteredResults.length }</dd>
          </dl>
          <dl className="metadata-type-numeric">
            <dt><Translate>Average sentence score</Translate></dt>
            <dd>{ (doc.semanticSearch.averageScore * 100).toFixed(1) }%</dd>
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
