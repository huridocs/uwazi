import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { t } from 'app/I18N';

import Modal from 'app/Layout/Modal';
import Loader from 'app/components/Elements/Loader';

export class Confirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: props.isOpen,
      isLoading: props.isLoading,
      confirmInputValue: '',
    };

    this.accept = this.accept.bind(this);
    this.cancel = this.cancel.bind(this);
    this.close = this.close.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (newProps.accept !== this.props.accept) {
      this.setState({ isOpen: true });
    }
  }

  close() {
    this.setState({ isOpen: false, confirmInputValue: '', isLoading: false });
  }

  accept() {
    if (this.props.accept) {
      const actionResponse = this.props.accept();
      if (actionResponse && actionResponse instanceof Promise) {
        this.setState({ isLoading: true });
        actionResponse.then(this.close);
        actionResponse.catch(this.close);
        return;
      }
    }
    this.close();
  }

  cancel() {
    if (this.props.cancel) {
      this.props.cancel();
    }
    this.close();
  }

  handleInput(e) {
    this.setState({ confirmInputValue: e.target.value });
  }

  renderExtraConfirm() {
    return (
      <React.Fragment>
        <p> If you want to continue, please type &#39;{this.props.extraConfirmWord}&#39; </p>
        <input type="text" onChange={this.handleInput} value={this.state.confirmInputValue} />
      </React.Fragment>
    );
  }

  render() {
    const { type } = this.props;
    return (
      <Modal isOpen={this.state.isOpen} type={type}>
        <Modal.Body>
          <h4>{this.props.title}</h4>
          <p>{this.props.message}</p>
          {this.props.extraConfirm && !this.state.isLoading && this.renderExtraConfirm()}
          {this.state.isLoading && <Loader />}
        </Modal.Body>

        {!this.state.isLoading && (
          <Modal.Footer>
            {!this.props.noCancel && (
              <button type="button" className="btn btn-default cancel-button" onClick={this.cancel}>
                {t('System', 'Cancel')}
              </button>
            )}
            <button
              type="button"
              disabled={
                this.props.extraConfirm &&
                this.state.confirmInputValue !== this.props.extraConfirmWord
              }
              className={`btn confirm-button btn-${type}`}
              onClick={this.accept}
            >
              {t('System', 'Accept')}
            </button>
          </Modal.Footer>
        )}
      </Modal>
    );
  }
}

Confirm.defaultProps = {
  isLoading: false,
  extraConfirm: false,
  isOpen: false,
  noCancel: false,
  type: 'danger',
  title: 'Confirm action',
  message: 'Are you sure you want to continue?',
  extraConfirmWord: 'CONFIRM',
};

Confirm.propTypes = {
  isLoading: PropTypes.bool,
  extraConfirm: PropTypes.bool,
  extraConfirmWord: PropTypes.string,
  isOpen: PropTypes.bool,
  noCancel: PropTypes.bool,
  accept: PropTypes.func,
  cancel: PropTypes.func,
  type: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
};

export default Confirm;
