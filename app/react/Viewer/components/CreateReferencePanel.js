import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import 'app/Viewer/scss/createmodal.scss';

import SidePanel from 'app/Layout/SidePanel';
import ViewerSearchForm from 'app/Viewer/components/ViewerSearchForm';
import SearchResults from 'app/Viewer/presentation/SearchResults';
import {selectTargetDocument} from 'app/Viewer/actions/uiActions';

export class CreateReferencePanel extends Component {
  render() {
    let sidePanelprops = {open: this.props.referencePanel};
    return (
      <SidePanel {...sidePanelprops}>
        <h1>Create document reference</h1>

        <ViewerSearchForm />

        <SearchResults
          results={this.props.results}
          searching={this.props.searching}
          selected={this.props.selected}
          onClick={this.props.selectTargetDocument}
        />

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
  searching: PropTypes.bool,
  selected: PropTypes.string,
  selectTargetDocument: PropTypes.func
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();
  return {
    referencePanel: uiState.referencePanel,
    results: state.documentViewer.results,
    searching: uiState.viewerSearching,
    selected: uiState.reference.targetDocument
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectTargetDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateReferencePanel);
