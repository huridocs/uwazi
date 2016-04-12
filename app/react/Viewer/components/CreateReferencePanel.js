import React, {Component, PropTypes} from 'react';
import SidePanel from 'app/Layout/SidePanel';
import {connect} from 'react-redux';

import 'app/Viewer/scss/createmodal.scss';

import ViewerSearchForm from 'app/Viewer/components/ViewerSearchForm';

export class CreateReferencePanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.referencePanel};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Create document reference</h1>
        <ViewerSearchForm />
        <div className="item-group">
          {(() => {
            if (this.props.searching) {
              return <div>Searching...</div>;
            }
            return this.props.results.map((result, index) => {
              return (
                <li key={index}>
                <div className="item">
                <span className="item-name">{result.title}</span>
                </div>
                </li>
              );
            });
          })()}
        </div>
        <ul className="search__filter search__filter--radiobutton">
          <li>Relationship type</li>
          <li className="is-active"><i className="fa fa-check"></i>
            <label>Based on</label>
          </li>
          <li> <i className="fa"></i>
            <label>Support to</label>
          </li>
          <li> <i className="fa"></i>
            <label>Contradicts</label>
          </li>
          <li> <i className="fa"></i>
            <label>Judgements</label>
          </li>
        </ul>
      </SidePanel>
    );
  }
}

CreateReferencePanel.propTypes = {
  referencePanel: PropTypes.bool,
  results: PropTypes.array,
  searching: PropTypes.bool
};

const mapStateToProps = (state) => {
  return {
    referencePanel: state.documentViewer.uiState.toJS().referencePanel,
    results: state.documentViewer.results,
    searching: state.documentViewer.uiState.toJS().viewerSearching
  };
};

export default connect(mapStateToProps)(CreateReferencePanel);
