import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions as formActions} from 'react-redux-form';
import {unselectDocument} from '../actions/libraryActions';

import {hideModal} from 'app/Modals/actions/modalActions';
import Modal from 'app/Layout/Modal';

export class ConfirmCloseForm extends Component {

  confirm() {
    this.props.hideModal('ConfirmCloseForm');
    this.props.resetForm('library.sidepanel.metadata');
    this.props.unselectDocument(this.props.doc.get('_id'));
  }

  render() {
    if (!this.props.doc) {
      return false;
    }

    let doc = this.props.doc;

    return (
      <Modal isOpen={!!doc} type="danger">

        <Modal.Body>
          <h4>Confirm</h4>
          <p>All changes will be lost, are you sure you want to proceed?</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('ConfirmCloseForm')}>
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

ConfirmCloseForm.propTypes = {
  hideModal: PropTypes.func,
  resetForm: PropTypes.func,
  unselectDocument: PropTypes.func,
  doc: PropTypes.object
};

const mapStateToProps = (state) => {
  return {doc: state.modals.get('ConfirmCloseForm')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectDocument, hideModal, resetForm: formActions.reset}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmCloseForm);
