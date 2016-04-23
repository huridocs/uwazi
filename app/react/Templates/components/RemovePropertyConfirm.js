import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'react-modal';

import {hideRemovePropertyConfirm} from 'app/Templates/actions/uiActions';
import {removeProperty} from 'app/Templates/actions/templateActions';

export class RemovePropertyConfirm extends Component {

  confirm() {
    this.props.hideRemovePropertyConfirm();
    this.props.removeProperty(this.props.propertyBeingDeleted);
  }

  render() {
    let style = {overlay: {zIndex: 100}};
    return (
      <Modal
        style={style}
        className="Modal__Bootstrap modal-dialog"
        isOpen={this.props.isOpen}
        onRequestClose={() => {}}
      >
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" onClick={this.props.hideRemovePropertyConfirm}>
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Close</span>
            </button>
            <h4 className="modal-title">Deleting Template Property</h4>
          </div>
          <div className="modal-body">
            <h4>Are you sure ?</h4>
            <p>Deleting a Template property will delete this metadata information on all documents using this template</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default cancel-button" onClick={this.props.hideRemovePropertyConfirm}>Cancel</button>
            <button type="button" className="btn btn-primary confirm-button" onClick={() => this.confirm()}>Ok</button>
          </div>
        </div>
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
