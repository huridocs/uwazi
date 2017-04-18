import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';

import ContextMenu from 'app/ContextMenu';

import {enterUploads} from '../actions/uploadsActions';

import UploadBox from './UploadBox';
import UploadsList from './UploadsList';
import UploadsFormPanel from './UploadsFormPanel';
import UploadFailedModal from './UploadFailedModal';
import SelectMultiplePanelContainer from '../containers/SelectMultiplePanelContainer';
import UploadsMenu from './UploadsMenu';
import ReadyToPublishModal from './ReadyToPublishModal';
import {t} from 'app/I18N';

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
      className = 'document-viewer with-panel is-active';
    }
    return (
      <div className="row">
        <Helmet title={t('System', 'Uploads')}/>
        <main className={className}>
          <UploadBox />
          <UploadsList socket={this.socket}/>
        </main>
        <UploadsFormPanel />
        <SelectMultiplePanelContainer />
        <UploadFailedModal />
        <ReadyToPublishModal />

        <UploadsMenu />
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
  return {
    panelIsOpen: !!state.uploads.uiState.get('selectedDocuments').size
  };
};

export default connect(mapStateToProps)(UploadsSection);
