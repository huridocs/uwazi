import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {removeProperty} from 'app/Templates/actions/templateActions';
import {hideModal} from 'app/Modals/actions/modalActions';

export class RemovePropertyConfirm extends Component {

  confirm() {
    this.props.hideModal('RemovePropertyModal');
    this.props.removeProperty(this.props.propertyBeingDeleted);
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger">

        <Modal.Body>
          <h4>Are you sure ? (change will take effect when saving the template)</h4>
          <p>Deleting a Template property will delete this metadata information on all documents using this template</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={() => this.props.hideModal('RemovePropertyModal') }>Cancel</button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>Delete Property</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

RemovePropertyConfirm.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  removeProperty: PropTypes.func,
  propertyBeingDeleted: PropTypes.number
};

const mapStateToProps = (state) => {
  let propertyBeingDeleted = state.modals.toJS().RemovePropertyModal;
  return {
    propertyBeingDeleted: propertyBeingDeleted,
    isOpen: typeof propertyBeingDeleted === 'number'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, removeProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RemovePropertyConfirm);
