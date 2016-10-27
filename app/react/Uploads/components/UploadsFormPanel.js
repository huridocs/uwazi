// Entire component is UNTESTED!
// TEST
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {finishEdit} from 'app/Uploads/actions/uploadsActions';
import SidePanel from 'app/Layout/SidePanel';
import DocumentForm from '../containers/DocumentForm';
import EntityForm from '../containers/EntityForm';
import ShowIf from 'app/App/ShowIf';

export class UploadsFormPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  close() {
    if (this.props.dirty) {
      return this.context.confirm({
        accept: () => {
          this.props.finishEdit();
        },
        message: 'Are you sure you want to close the form? All the progress will be lost.'
      });
    }

    this.props.finishEdit();
  }

  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <div className="sidepanel-header">
          <h1>Metadata</h1>
          <i className='closeSidepanel fa fa-close close-modal' onClick={this.close.bind(this)}></i>
        </div>
        <div className="sidepanel-body">
          <ShowIf if={this.props.metadataType === 'document'}>
            <DocumentForm/>
          </ShowIf>
          <ShowIf if={this.props.metadataType === 'entity'}>
            <EntityForm/>
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

UploadsFormPanel.propTypes = {
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  finishEdit: PropTypes.func,
  metadataType: PropTypes.string,
  dirty: PropTypes.bool
};

UploadsFormPanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = ({uploads}) => {
  let uiState = uploads.uiState;
  let metadataType = '';
  if (uiState.get('metadataBeingEdited')) {
    metadataType = uiState.get('metadataBeingEdited').type;
  }

  return {
    open: typeof uiState.get('metadataBeingEdited') === 'object',
    metadataType,
    dirty: uploads.metadataForm.dirty
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({finishEdit}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(UploadsFormPanel);
