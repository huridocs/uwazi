import React, { Component } from 'react';
import { Icon } from 'app/UI';
import { t } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { exportDocuments } from 'app/Library/actions/exportActions';
import { ExportStore } from '../reducers/ExportStoreType';

export type ExportButtonProps = {
  processing: boolean;
  storeKey: string;
  exportDocuments: (keyStore: string) => any;
};

class ExportButton extends Component<ExportButtonProps, {}> {
  constructor(props: ExportButtonProps) {
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
      <span
        onClick={this.export}
        className={`btn btn-primary ${this.props.processing ? 'btn-disabled' : ''}`}
      >
        {!this.props.processing ? (
          <Icon icon="export-csv" transform="right-0.075 up-0.1" />
        ) : (
          <Icon icon="spinner" spin />
        )}
        <span className="btn-label">{t('System', 'Export CSV')}</span>
      </span>
    );
  }
}

function mapDispatchToProps(dispatch: Dispatch<any>, props: Pick<ExportButtonProps, 'storeKey'>) {
  return bindActionCreators({ exportDocuments }, wrapDispatch(dispatch, props.storeKey));
}

function mapStateToProps(state: ExportStore) {
  return {
    processing: state.exportSearchResults.exportSearchResultsProcessing,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExportButton);
