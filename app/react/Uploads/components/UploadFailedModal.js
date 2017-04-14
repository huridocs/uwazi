import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideModal} from 'app/Modals/actions/modalActions';
import {deleteDocument, unselectAllDocuments} from 'app/Uploads/actions/uploadsActions';

export class UploadFailedModal extends Component {

  confirm() {
    this.props.unselectAllDocuments();
    this.props.hideModal('uploadFailed');
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
          <p>There was a problem uploading the selected document</p>
          <p><strong>{doc.title}</strong></p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('uploadFailed') }>
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

UploadFailedModal.propTypes = {
  hideModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  unselectAllDocuments: PropTypes.func,
  doc: PropTypes.object
};

const mapStateToProps = (state) => {
  return {doc: state.modals.get('uploadFailed')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, deleteDocument, unselectAllDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadFailedModal);
