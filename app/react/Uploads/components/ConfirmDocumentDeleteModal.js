import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideModal} from 'app/Modals/actions/modalActions';
import {deleteDocument, finishEdit} from 'app/Uploads/actions/uploadsActions';

export class ConfirmDocumentDeleteModal extends Component {

  confirm() {
    this.props.finishEdit();
    this.props.hideModal('deleteDocument');
    this.props.deleteDocument(this.props.doc.toJS());
  }

  render() {
    if (!this.props.doc) {
      return <div />;
    }

    let doc = this.props.doc.toJS();

    return (
      <Modal isOpen={!!doc} type="danger">

        <Modal.Body>
          <h4>Confirm deletion</h4>
          <p>Are you sure you want to delete the document: {doc.title}</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('deleteDocument') }>
            <i className="fa fa-close"></i> Cancel
          </button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>
            <i className="fa fa-trash"></i> Delete document
          </button>
        </Modal.Footer>

      </Modal>
    );
  }
}

ConfirmDocumentDeleteModal.propTypes = {
  hideModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  finishEdit: PropTypes.func,
  doc: PropTypes.object
};

const mapStateToProps = (state) => {
  return {doc: state.modals.get('deleteDocument')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, deleteDocument, finishEdit}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmDocumentDeleteModal);
