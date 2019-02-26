import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import { t } from 'app/I18N';
import SnippetList from 'app/Documents/components/SnippetList';
import { selectSnippet } from 'app/Viewer/actions/uiActions';

const findResultsAboveThreshold = (results, threshold) => {
  const boundingIndex = results.findIndex(({ score }) => score < threshold);
  return results.slice(0, boundingIndex);
};

export class DocumentResults extends Component {
  constructor(props) {
    super(props);
    this.state = { threshold: 0.2 };
    this.onChangeTreshHold = this.onChangeTreshHold.bind(this);
  }

  onChangeTreshHold(e) {
    this.setState({ threshold: e.target.value });
  }

  render() {
    const { doc } = this.props;
    let snippets = {};
    let avgScore = 0;
    let aboveThreshold = 0;
    if (doc.semanticSearch) {
      const filteredResults = findResultsAboveThreshold(doc.semanticSearch.results, this.state.threshold);
      avgScore = doc.semanticSearch.averageScore;
      aboveThreshold = filteredResults.length;
      snippets = Immutable.fromJS({
        count: aboveThreshold,
        metadata: [],
        fullText: filteredResults
      });
    }
    const documentViewUrl = doc.file ? `/document/${doc.sharedId}` : `/entity/${doc.sharedId}`;
    return (
      <React.Fragment>
        <div className="view">
          <dl className="metadata-type-text">
            <dt className="item-header">
              {t('System', 'Threshold')}
            </dt>
            <dd>
              <input type="range" min="0" max="1" step="0.01" value={this.state.threshold} onChange={this.onChangeTreshHold}/>
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
          selectSnippet={(...args) => {
            this.props.selectSnippet(...args);
          }}
        />}
      </React.Fragment>
    );
  }
}

DocumentResults.propTypes = {
  doc: PropTypes.object.isRequired,
  selectSnippet: PropTypes.func.isRequired
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators({ selectSnippet }, dispatch);
}

export default connect(null, mapDispatchToProps)(DocumentResults);
