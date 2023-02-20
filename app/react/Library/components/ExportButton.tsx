import React, { Component } from 'react';
import { Icon } from 'app/UI';
import { t, Translate } from 'app/I18N';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { exportDocuments } from 'app/Library/actions/exportActions';
import { User } from 'api/users/usersModel';
import Modal from 'app/Layout/Modal';
import { CaptchaValue } from 'shared/types/Captcha';
import { Captcha, FormGroup } from 'app/ReactReduxForms';
import { IImmutable } from 'shared/types/Immutable';
import { LocalForm } from 'app/Forms/Form';
import { ExportStore } from '../reducers/ExportStoreType';

type ExportButtonProps = {
  processing: boolean;
  storeKey: string;
  user: IImmutable<User>;
  className?: string;
  exportDocuments: (keyStore: string, captcha?: CaptchaValue) => any;
};

class ExportButton extends Component<ExportButtonProps, { modal: boolean }> {
  static defaultProps: { className: string };

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
    let btnClassName = 'btn btn-default btn-export';
    btnClassName += this.props.processing ? ' btn-disabled' : '';
    btnClassName += ` ${this.props.className}`;
    return (
      <>
        <button
          type="button"
          onClick={this.props.user.get('_id') ? this.export : this.showModal}
          className={btnClassName}
        >
          {!this.props.processing ? (
            <Icon icon="export-csv" transform="up-0.1" />
          ) : (
            <Icon icon="spinner" spin />
          )}
          <span className="btn-label">{t('System', 'Export CSV')}</span>
        </button>
        {this.state.modal && (
          <Modal isOpen type="export">
            <LocalForm
              onSubmit={this.exportWithCaptcha}
              validators={{ captcha: { required: (val: any) => val && val.text.length } }}
            >
              <FormGroup key="captcha" model=".captcha">
                <h3>
                  <Translate>Exporting entities to CSV</Translate>
                </h3>
                <p>
                  <Translate>
                    Please type in letters and numbers from the image to start the export.
                  </Translate>
                </p>
                <Captcha remote={false} model=".captcha" />
              </FormGroup>
              <div className="buttons">
                <input
                  type="button"
                  className="btn"
                  onClick={() => {
                    this.setState({ modal: false });
                  }}
                  value="Cancel"
                />
                <input type="submit" className="btn btn-success" value="Export" />
              </div>
            </LocalForm>
          </Modal>
        )}
      </>
    );
  }
}

ExportButton.defaultProps = {
  className: '',
};

function mapDispatchToProps(dispatch: Dispatch<any>, props: Pick<ExportButtonProps, 'storeKey'>) {
  return bindActionCreators({ exportDocuments }, wrapDispatch(dispatch, props.storeKey));
}

function mapStateToProps(state: ExportStore) {
  return {
    processing: state.exportSearchResults.exportSearchResultsProcessing,
    user: state.user,
  };
}

export type { ExportButtonProps };

export default connect(mapStateToProps, mapDispatchToProps)(ExportButton);
