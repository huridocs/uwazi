import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { actions as formActions } from 'react-redux-form';

import { hideModal } from 'app/Modals/actions/modalActions';
import Modal from 'app/Layout/Modal';
import { Icon } from 'UI';
import { closePanel } from '../actions/uiActions';

export class ConfirmCloseForm extends Component {
  confirm() {
    this.props.hideModal('ConfirmCloseForm');
    this.props.closePanel();
    this.props.resetForm('documentViewer.sidepanel.metadata');
  }

  render() {
    if (!this.props.doc) {
      return false;
    }

    const { doc } = this.props;

    return (
      <Modal isOpen={!!doc} type="danger">
        <Modal.Body>
          <h4>Confirm</h4>
          <p>All changes will be lost, are you sure you want to proceed?</p>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-default cancel-button"
            onClick={() => this.props.hideModal('ConfirmCloseForm')}
          >
            <Icon icon="times" /> Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger confirm-button"
            onClick={() => this.confirm()}
          >
            <Icon icon="trash-alt" /> Ok
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ConfirmCloseForm.propTypes = {
  hideModal: PropTypes.func,
  resetForm: PropTypes.func,
  closePanel: PropTypes.func,
  doc: PropTypes.object,
};

const mapStateToProps = state => ({ doc: state.modals.get('ConfirmCloseForm') });

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ closePanel, hideModal, resetForm: formActions.reset }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmCloseForm);
