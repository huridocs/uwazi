import PropTypes from 'prop-types';
// Entire component is UNTESTED!
// TEST
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {unselectAllDocuments} from 'app/Uploads/actions/uploadsActions';
import SidePanel from 'app/Layout/SidePanel';
import ShowIf from 'app/App/ShowIf';
import DocumentForm from '../containers/DocumentForm';
import EntityForm from '../containers/EntityForm';
import UploadsFormPanelButtons from './UploadsFormPanelButtons';

export class UploadsFormPanel extends Component {
  submit(doc) {
    this.props.saveDocument(doc);
  }

  close() {
    if (this.props.dirty) {
      return this.context.confirm({
        accept: () => {
          this.props.unselectAllDocuments();
        },
        message: 'Are you sure you want to close the form? All the progress will be lost.'
      });
    }
  }

  render() {
    let sidePanelprops = {open: this.props.open};
    return (
      <SidePanel {...sidePanelprops}>
        <div className="sidepanel-header">
          <ul className="nav nav-tabs">
            <li><div className="tab-link tab-link-active">
              <i className="fa fa-info-circle"></i>
              <span className="tab-link-tooltip">Info</span>
            </div></li>
          </ul>
          <i className='closeSidepanel fa fa-close close-modal' onClick={this.close.bind(this)}></i>
        </div>
        <UploadsFormPanelButtons />
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
  unselectAllDocuments: PropTypes.func,
  metadataType: PropTypes.string,
  dirty: PropTypes.bool
};

UploadsFormPanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = ({uploads}) => {
  let uiState = uploads.uiState;
  let metadataType = '';
  const selectedDocuments = uiState.get('selectedDocuments');
  const open = selectedDocuments.size === 1;
  if (open) {
    metadataType = selectedDocuments.first().get('type');
  }

  return {
    open,
    metadataType,
    dirty: uploads.metadataForm.dirty
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectAllDocuments}, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(UploadsFormPanel);
