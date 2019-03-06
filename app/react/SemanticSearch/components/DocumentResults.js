import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { Translate, I18NLink } from 'app/I18N';
import SnippetList from 'app/Documents/components/SnippetList';
import { selectSnippet } from 'app/Viewer/actions/uiActions';
import { NumericRangeSlide } from 'app/Forms';
import { actions } from 'app/BasicReducer';

const findResultsAboveThreshold = (results, threshold) => {
  const boundingIndex = results.findIndex(({ score }) => score < threshold);
  return results.slice(0, boundingIndex);
};

export class DocumentResults extends Component {
  constructor(props) {
    super(props);
    this.onChangeTreshHold = this.onChangeTreshHold.bind(this);
    this.state = { threshold: props.threshold };
  }

  onChangeTreshHold(threshold) {
    this.setState({ threshold });
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.props.changeTreshHold(threshold);
    }, 500);
  }

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
          <Translate>Threshold</Translate> {this.state.threshold}
        </dt>
        <dd>
          <NumericRangeSlide min={0} max={1} step={0.01} value={this.state.threshold} onChange={this.onChangeTreshHold}/>
        </dd>
      </dl>
    );
  }

  render() {
    const { doc } = this.props;
    if (!doc.semanticSearch) {
      return false;
    }
    const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, this.props.threshold).sort((a, b) => a.score > b.score);
    const snippetsToRender = filteredResults.slice(0, 50);
    const snippets = Immutable.fromJS({ count: snippetsToRender.length, metadata: [], fullText: snippetsToRender });
    const documentViewUrl = doc.file ? `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;
    return (
      <React.Fragment>
        <div className="view">
          {this.renderFilter()}
          <dl className="metadata-type-numeric">
            <dt><Translate>Sentences above threshold</Translate></dt>
            <dd>{ filteredResults.length }</dd>
          </dl>
          <dl className="metadata-type-numeric">
            <dt><Translate>Average sentence score</Translate></dt>
            <dd>{ doc.semanticSearch.averageScore }</dd>
          </dl>
        </div>
        {this.renderSnippetsList(doc, snippets, documentViewUrl)}
        <div className="view">
          <dl><I18NLink to={documentViewUrl}>More sentences in the document</I18NLink></dl>
        </div>
      </React.Fragment>
    );
  }
}

DocumentResults.propTypes = {
  doc: PropTypes.object.isRequired,
  threshold: PropTypes.number.isRequired,
  selectSnippet: PropTypes.func.isRequired,
  changeTreshHold: PropTypes.func.isRequired
};

const mapStateToProps = ({ semanticSearch }) => ({
    threshold: semanticSearch.documentSentencesTreshold
});


function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectSnippet, changeTreshHold: actions.set.bind(null, 'semanticSearch/documentSentencesTreshold') }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentResults);
