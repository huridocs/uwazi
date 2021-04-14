import React, { Component } from 'react';
import { Icon } from 'app/UI';
import { t, Translate } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { exportDocuments } from 'app/Library/actions/exportActions';
import { User } from 'api/users/usersModel';
import Modal from 'app/Layout/Modal';
import { LocalForm } from 'react-redux-form';
import { CaptchaValue } from 'shared/types/Captcha';
import { Captcha, FormGroup } from 'app/ReactReduxForms';
import { ExportStore } from '../reducers/ExportStoreType';

export type ExportButtonProps = {
  processing: boolean;
  storeKey: string;
  user: User;
  exportDocuments: (keyStore: string, captcha?: CaptchaValue) => any;
};

class ExportButton extends Component<ExportButtonProps, { modal: boolean }> {
  constructor(props: ExportButtonProps) {
    super(props);
    this.state = {
      modal: false,
    };
    this.export = this.export.bind(this);
    this.showModal = this.showModal.bind(this);
    this.exportWithCaptcha = this.exportWithCaptcha.bind(this);
  }

  export() {
    if (!this.props.processing) {
      this.props.exportDocuments(this.props.storeKey);
    }
  }

  exportWithCaptcha(values: { captcha: CaptchaValue }) {
    if (!this.props.processing) {
      this.props.exportDocuments(this.props.storeKey, values.captcha);
    }
    this.setState({ modal: false });
  }

  showModal() {
    this.setState({ modal: true });
  }

  render() {
    return (
      <>
        <button
          type="button"
          onClick={this.props.user._id ? this.export : this.showModal}
          className={`btn btn-primary btn-export ${this.props.processing ? 'btn-disabled' : ''}`}
        >
          {!this.props.processing ? (
            <Icon icon="export-csv" transform="right-0.075 up-0.1" />
          ) : (
            <Icon icon="spinner" spin />
          )}
          <span className="btn-label">{t('System', 'Export CSV')}</span>
        </button>
        {this.state.modal && (
          <Modal isOpen type="export">
            <LocalForm onSubmit={this.exportWithCaptcha}>
              <FormGroup key="captcha" model=".captcha">
                <h2>
                  <Translate>Exporting entities to CSV</Translate>
                </h2>
                <Translate>
                  Please type in letters and numbers from the image to start the export.
                </Translate>
                <Captcha remote={false} model=".captcha" />
              </FormGroup>
              <input
                type="button"
                className="btn"
                onClick={() => {
                  this.setState({ modal: false });
                }}
                value="Cancel"
              />
              <input type="submit" className="btn btn-success" value="Export" />
            </LocalForm>
          </Modal>
        )}
      </>
    );
  }
}

function mapDispatchToProps(dispatch: Dispatch<any>, props: Pick<ExportButtonProps, 'storeKey'>) {
  return bindActionCreators({ exportDocuments }, wrapDispatch(dispatch, props.storeKey));
}

function mapStateToProps(state: ExportStore) {
  return {
    processing: state.exportSearchResults.exportSearchResultsProcessing,
    user: state.user.toJS(),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExportButton);
