import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Translate } from 'app/I18N';
import Modal from './Modal';

class ConfirmModal extends Component {
  render() {
    return (
      <Modal isOpen={this.props.isOpen} type={this.props.type}>
        <Modal.Body>
          <h4>
            <Translate>{this.props.title}</Translate>
          </h4>
          <p>
            <Translate>{this.props.message}</Translate>
          </p>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-default cancel-button"
            onClick={this.props.onCancel}
          >
            <Translate>Cancel</Translate>
          </button>
          <button
            type="button"
            className={`btn confirm-button btn-${this.props.type}`}
            onClick={this.props.onAccept}
          >
            <Translate>Accept</Translate>
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ConfirmModal.defaultProps = {
  isOpen: true,
  message: 'Are you sure you want to continue?',
  title: 'Confirm action',
  type: 'danger',
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool,
  type: PropTypes.string,
  message: PropTypes.string,
  title: PropTypes.string,
  onAccept: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmModal;
