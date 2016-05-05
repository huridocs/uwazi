import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideModal} from 'app/Modals/actions/modalActions';
import {editDocument} from 'app/Uploads/actions/uploadsActions';
import {loadDocument} from 'app/DocumentForm/actions/actions';

export class MetadataRequiredModal extends Component {

  editDocument() {
    this.props.hideModal('metadataRequired');
    let doc = this.props.doc.toJS();
    this.props.loadDocument(doc, this.props.templates.toJS());
    this.props.editDocument(doc);
  }

  render() {
    if (!this.props.doc) {
      return <div />;
    }

    let doc = this.props.doc.toJS();
    return (
      <Modal isOpen={!!doc} type="warning">

        <Modal.Body>
          <p>The selected document is not complete:</p>
          <p><b>{doc.title}</b></p>
          <p>You need to fill the required metadata before you can publish it.</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('metadataRequired')}>
            <i className="fa fa-close"></i> Cancel
          </button>
          <button type="button" className="btn btn-warning confirm-button" onClick={this.editDocument.bind(this)}>
            <i className="fa fa-send"></i> Edit metadata
          </button>
        </Modal.Footer>

      </Modal>
    );
  }
}

MetadataRequiredModal.propTypes = {
  isOpen: PropTypes.bool,
  doc: PropTypes.object,
  templates: PropTypes.object,
  hideModal: PropTypes.func,
  editDocument: PropTypes.func,
  loadDocument: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    doc: state.modals.get('metadataRequired'),
    templates: state.uploads.templates
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, editDocument, loadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataRequiredModal);
