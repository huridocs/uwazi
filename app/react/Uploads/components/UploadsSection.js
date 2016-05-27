import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import ContextMenu from 'app/ContextMenu';

import {enterUploads} from '../actions/uploadsActions';

import UploadBox from './UploadBox';
import UploadsList from './UploadsList';
import UploadsFormPanel from './UploadsFormPanel';
import ReadyToPublishModal from './ReadyToPublishModal';
import UploadFailedModal from './UploadFailedModal';
import ConfirmDocumentDeleteModal from './ConfirmDocumentDeleteModal';
import UploadsMenu from './UploadsMenu';

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
        <UploadsFormPanel />
        <ReadyToPublishModal />
        <UploadFailedModal />
        <ConfirmDocumentDeleteModal />

        <ContextMenu>
          <UploadsMenu />
        </ContextMenu>
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
