import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Icon } from 'app/UI';
import { t } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { exportDocuments } from 'app/Library/actions/libraryActions';

export class ExportButton extends Component {
  constructor(props) {
    super(props);
    //TODO: move to reducer
    this.state = {
      processing: false,
    };
    this.export = this.export.bind(this);
  }

  export() {
    this.setState({ processing: true });
    this.props.exportDocuments(this.props.storeKey).then(({ content, fileName }) => {
      const url = window.URL.createObjectURL(new Blob([content]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      this.setState({ processing: false });
    });
  }

  render() {
    return (
      <span onClick={this.export} className="btn btn-primary" disabled={this.state.processing}>
        {!this.state.processing ? (
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
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ exportDocuments }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(null, mapDispatchToProps)(ExportButton);
