
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions as formActions} from 'react-redux-form';

import {closePanel, resetReferenceCreation} from '../actions/uiActions';
import {hideModal} from 'app/Modals/actions/modalActions';
import Modal from 'app/Layout/Modal';

export class ConfirmCloseReferenceForm extends Component {

  confirm() {
    this.props.hideModal('ConfirmCloseReferenceForm');
    this.props.closePanel();
    this.props.resetReferenceCreation();
  }

  render() {
    if (!this.props.reference) {
      return false;
    }

    let reference = this.props.reference;

    return (
      <Modal isOpen={!!reference} type="danger">

        <Modal.Body>
          <h4>Confirm</h4>
          <p>All changes will be lost, are you sure you want to proceed?</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('ConfirmCloseReferenceForm')}>
            <i className="fa fa-close"></i> Cancel
          </button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>
            <i className="fa fa-trash"></i> Ok
          </button>
        </Modal.Footer>

      </Modal>
    );
  }
}

ConfirmCloseReferenceForm.propTypes = {
  hideModal: PropTypes.func,
  resetReferenceCreation: PropTypes.func,
  closePanel: PropTypes.func,
  reference: PropTypes.object
};

const mapStateToProps = (state) => {
  return {reference: state.modals.get('ConfirmCloseReferenceForm')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({closePanel, hideModal, resetReferenceCreation}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmCloseReferenceForm);
