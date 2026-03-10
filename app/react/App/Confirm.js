import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate, t } from 'app/I18N';

import Modal from 'app/Layout/Modal';
import { Loader } from 'app/components/Elements/Loader';

class Confirm extends Component {
  static getDerivedStateFromProps(newProps, state) {
    if (newProps.accept !== state.accept) {
      return { isOpen: true, accept: newProps.accept };
    }

    return null;
  }

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
      <>
        <p>
          <Translate>If you want to continue, please type</Translate> &#39;
          {this.props.extraConfirmWord}&#39;{' '}
        </p>
        <input type="text" onChange={this.handleInput} value={this.state.confirmInputValue} />
      </>
    );
  }

  render() {
    const { type, acceptLabel, zIndex, message, title, messageKey } = this.props;
    return (
      <Modal isOpen={this.state.isOpen} type={type} zIndex={zIndex}>
        <Modal.Body>
          <h4>
            {typeof title !== 'string' && title}
            {typeof title === 'string' && <Translate>{title}</Translate>}
          </h4>
          <p>
            {typeof message !== 'string' && message}
            {typeof message === 'string' && (
              <Translate translationKey={messageKey}>{message}</Translate>
            )}
          </p>
          {this.props.extraConfirm && !this.state.isLoading && this.renderExtraConfirm()}
          {this.state.isLoading && <Loader />}
        </Modal.Body>

        {!this.state.isLoading && (
          <Modal.Footer>
            {!this.props.noCancel && (
              <button type="button" className="btn btn-default cancel-button" onClick={this.cancel}>
                <Translate>Cancel</Translate>
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
              <Translate>{acceptLabel}</Translate>
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
  messageKey: '',
  message: 'Are you sure you want to continue?',
  extraConfirmWord: t('System', 'CONFIRM', null, false),
  acceptLabel: 'Accept',
  zIndex: 99,
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
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  messageKey: PropTypes.string,
  acceptLabel: PropTypes.string,
  zIndex: PropTypes.number,
};

export { Confirm };
export default Confirm;
