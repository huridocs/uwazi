import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsList from 'app/Uploads/components/UploadsList';
import UploadsFormPanel from 'app/Uploads/components/UploadsFormPanel';
import ReadyToPublishModal from 'app/Uploads/components/ReadyToPublishModal';
import UploadFailedModal from 'app/Uploads/components/UploadFailedModal';
import ConfirmDocumentDeleteModal from 'app/Uploads/components/ConfirmDocumentDeleteModal';
import ContextMenu from 'app/ContextMenu/components/ContextMenu';
import {enterUploads} from 'app/Uploads/actions/uploadsActions';

import io from 'socket.io-client';

export class UploadsSection extends Component {

  componentDidMount() {
    this.context.store.dispatch(enterUploads());
  }

  componentWillMount() {
    this.socket = io();
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  render() {
    let className = 'document-viewer';
    if (this.props.panelIsOpen) {
      className = 'document-viewer with-panel';
    }
    return (
      <div className="row">
        <main className={'col-sm-8 col-sm-offset-2 ' + className}>
          <UploadBox />
          <UploadsList socket={this.socket}/>
        </main>
        <ContextMenu />
        <UploadsFormPanel />
        <ReadyToPublishModal />
        <UploadFailedModal />
        <ConfirmDocumentDeleteModal />
      </div>
    );
  }
}

UploadsSection.propTypes = {
  panelIsOpen: PropTypes.bool,
  targetDocument: PropTypes.bool
};

UploadsSection.contextTypes = {
  store: PropTypes.object
};

const mapStateToProps = (state) => {
  let uiState = state.uploads.uiState.toJS();
  return {
    panelIsOpen: !!uiState.documentBeingEdited
  };
};

export default connect(mapStateToProps)(UploadsSection);
