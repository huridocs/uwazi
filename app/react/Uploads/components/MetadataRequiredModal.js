import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';
import {Link} from 'react-router';

import {removeProperty} from 'app/Templates/actions/templateActions';
import {hideModal} from 'app/Modals/actions/modalActions';

export class MetadataRequiredModal extends Component {
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
          <Link to={`/document/${doc._id}`} className="btn btn-warning" onClick={() => this.props.hideModal('metadataRequired')}>
            <i className="fa fa-send"></i> Edit metadata
          </Link>
        </Modal.Footer>

      </Modal>
    );
  }
}

MetadataRequiredModal.propTypes = {
  isOpen: PropTypes.bool,
  doc: PropTypes.object,
  hideModal: PropTypes.func
};

const mapStateToProps = (state) => {
  return {doc: state.modals.get('metadataRequired')};
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, removeProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MetadataRequiredModal);
