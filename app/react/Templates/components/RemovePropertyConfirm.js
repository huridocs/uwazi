import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideRemovePropertyConfirm} from 'app/Templates/actions/uiActions';
import {removeProperty} from 'app/Templates/actions/templateActions';

export class RemovePropertyConfirm extends Component {

  confirm() {
    this.props.hideRemovePropertyConfirm();
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
          <button type="button" className="btn btn-default cancel-button" onClick={this.props.hideRemovePropertyConfirm}>Cancel</button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>Delete Property</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

RemovePropertyConfirm.propTypes = {
  isOpen: PropTypes.bool,
  hideRemovePropertyConfirm: PropTypes.func,
  removeProperty: PropTypes.func,
  propertyBeingDeleted: PropTypes.number
};

const mapStateToProps = (state) => {
  let propertyBeingDeleted = state.template.uiState.toJS().propertyBeingDeleted;
  return {
    propertyBeingDeleted: propertyBeingDeleted,
    isOpen: typeof propertyBeingDeleted === 'number'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideRemovePropertyConfirm, removeProperty}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RemovePropertyConfirm);
