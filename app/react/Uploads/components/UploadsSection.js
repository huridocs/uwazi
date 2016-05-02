import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import UploadBox from 'app/Uploads/components/UploadBox';
import UploadsList from 'app/Uploads/components/UploadsList';
import UploadsFormPanel from 'app/Uploads/components/UploadsFormPanel';
import socket from 'app/utils/socket';

export class UploadsSection extends Component {
  render() {
    let className = 'document-viewer';
    if (this.props.panelIsOpen) {
      className = 'document-viewer with-panel';
    }
    return (
      <div>
        <main className={'col-sm-8 col-sm-offset-2 ' + className}>
          <UploadBox />
          <UploadsList socket={socket}/>
        </main>
        <UploadsFormPanel />
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
