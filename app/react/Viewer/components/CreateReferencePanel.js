import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import 'app/Viewer/scss/createmodal.scss';

import SidePanel from 'app/Layout/SidePanel';
import ViewerSearchForm from 'app/Viewer/components/ViewerSearchForm';
import SearchResults from 'app/Viewer/components/SearchResults';
import {selectTargetDocument, closePanel} from 'app/Viewer/actions/uiActions';
import {setRelationType} from 'app/Viewer/actions/referencesActions';
import {Select} from 'app/Forms';
import {showModal} from 'app/Modals/actions/modalActions';
import CreateTargetConnectionMenu from './ViewerSaveTargetReferenceMenu';
import CreateConnectionMenu from './ViewerSaveReferenceMenu';
import ShowIf from 'app/App/ShowIf';

export class CreateReferencePanel extends Component {
  close() {
    this.props.showModal('ConfirmCloseReferenceForm', this.props.reference);
  }

  render() {
    const relationTypes = this.props.relationTypes.toJS();
    return (
      <SidePanel open={this.props.open} className="create-reference">
        <div className="sidepanel-header">
          <h1>Create Connection</h1>
          <i className="fa fa-close close-modal" onClick={this.close.bind(this)}></i>

          <div className="relationship-steps">
            <h2>Connection type<small>1</small></h2>
          </div>

          <Select
            value={this.props.relationType}
            placeholder="Connection type..."
            optionsValue="_id"
            optionsLabel="name"
            options={relationTypes}
            onChange={e => this.props.setRelationType(e.target.value)}
          />

        <div className="relationship-steps">
          <h2>Select document<small>2</small></h2>
        </div>
        <ViewerSearchForm />
      </div>

      <div className="sidepanel-footer">
        <ShowIf if={this.props.creatingToTarget}>
          <CreateTargetConnectionMenu />
        </ShowIf>
        <ShowIf if={!this.props.creatingToTarget}>
          <CreateConnectionMenu />
        </ShowIf>
      </div>

      <div className="sidepanel-body">
        <SearchResults
          results={this.props.results}
          searching={this.props.searching}
          selected={this.props.selected}
          onClick={this.props.selectTargetDocument}
        />
      </div>

    </SidePanel>
    );
  }
}

CreateReferencePanel.propTypes = {
  open: PropTypes.bool,
  creatingToTarget: PropTypes.bool,
  results: PropTypes.object,
  reference: PropTypes.object,
  searching: PropTypes.bool,
  selected: PropTypes.string,
  selectTargetDocument: PropTypes.func,
  closePanel: PropTypes.func,
  showModal: PropTypes.func,
  setRelationType: PropTypes.func,
  relationTypes: PropTypes.object,
  relationType: PropTypes.string
};

const mapStateToProps = (state) => {
  let uiState = state.documentViewer.uiState.toJS();

  return {
    open: uiState.panel === 'referencePanel' || uiState.panel === 'targetReferencePanel',
    creatingToTarget: uiState.panel === 'targetReferencePanel',
    reference: uiState.reference,
    results: state.documentViewer.results,
    searching: uiState.viewerSearching,
    selected: uiState.reference.targetDocument,
    relationType: uiState.reference.relationType || '',
    relationTypes: state.documentViewer.relationTypes
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({selectTargetDocument, setRelationType, closePanel, showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateReferencePanel);
