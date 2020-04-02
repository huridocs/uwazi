import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'app/UI';
import { t } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { exportDocuments } from 'app/Library/actions/exportActions';

export class ExportButton extends Component {
  constructor(props) {
    super(props);
    this.export = this.export.bind(this);
  }

  export() {
    if (!this.props.processing) {
      this.props.exportDocuments(this.props.storeKey);
    }
  }

  render() {
    return (
      <span onClick={this.export} className="btn btn-primary" disabled={this.props.processing}>
        {!this.props.processing ? (
          <Icon icon="export-csv" transform="right-0.5 up-1" />
        ) : (
          <Icon icon="spinner" spin />
        )}
        <span className="btn-label">{t('System', 'Export CSV')}</span>
      </span>
    );
  }
}

ExportButton.propTypes = {
  exportDocuments: PropTypes.func.isRequired,
  storeKey: PropTypes.string.isRequired,
  processing: PropTypes.bool.isRequired,
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ exportDocuments }, wrapDispatch(dispatch, props.storeKey));
}

function mapStateToProps(state) {
  return {
    processing: state.entityExport.exportProcessing,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExportButton);
