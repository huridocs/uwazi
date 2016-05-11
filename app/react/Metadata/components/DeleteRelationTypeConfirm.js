import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {deleteRelationType} from 'app/RelationTypes/actions/relationTypesActions';
import {hideModal} from 'app/Modals/actions/modalActions';

export class DeleteRelationTypeConfirm extends Component {

  confirm() {
    this.props.hideModal('DeleteRelationTypeConfirm');
    this.props.deleteRelationType(this.props.relationType);
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger">

        <Modal.Body>
          <h4>Confirm deletion</h4>
          <p>Are you sure you want to delete the relation type {this.props.relationType.name}?</p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button"
            onClick={() => this.props.hideModal('DeleteRelationTypeConfirm') }>Cancel</button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>Delete relation type</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

DeleteRelationTypeConfirm.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  deleteRelationType: PropTypes.func,
  relationType: PropTypes.object
};

const mapStateToProps = (state) => {
  let relationType = state.modals.toJS().DeleteRelationTypeConfirm || {};
  return {
    relationType,
    isOpen: !!relationType._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, deleteRelationType}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DeleteRelationTypeConfirm);
