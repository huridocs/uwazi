import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsList from 'app/Uploads/components/UploadsList';
import UploadsFormPanel from 'app/Uploads/components/UploadsFormPanel';
import MetadataRequiredModal from 'app/Uploads/components/MetadataRequiredModal';

import io from 'socket.io-client';

export class UploadsSection extends Component {

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
      <div>
        <main className={'col-sm-8 col-sm-offset-2 ' + className}>
          <UploadBox />
          <UploadsList socket={this.socket}/>
        </main>
        <UploadsFormPanel />
        <MetadataRequiredModal />
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
