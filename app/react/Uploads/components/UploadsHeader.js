import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { newEntity, showImportPanel } from 'app/Uploads/actions/uploadsActions';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'UI';

export class UploadsHeader extends Component {
  render() {
    return (
      <div className="content-header">
        <div className="content-header-title">
          <button
            type="button"
            className="btn btn-success btn-xs"
            onClick={() => this.props.newEntity('uploads')}
          >
            <Icon icon="plus" /> {t('System', 'New entity')}
          </button>
          <button
            type="button"
            className="btn btn-success btn-xs"
            onClick={this.props.showImportPanel}
          >
            <Icon icon="upload" /> {t('System', 'Import')}
          </button>
        </div>
      </div>
    );
  }
}

UploadsHeader.propTypes = {
  newEntity: PropTypes.func.isRequired,
  showImportPanel: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ newEntity, showImportPanel }, wrapDispatch(dispatch, 'uploads'));
}

export default connect(null, mapDispatchToProps)(UploadsHeader);
