import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { removeProperty } from 'app/Templates/actions/templateActions';
import { hideModal } from 'app/Modals/actions/modalActions';

export class RemovePropertyConfirm extends Component {
  confirm() {
    this.props.hideModal('RemovePropertyModal');
    this.props.removeProperty(this.props.propertyBeingDeleted);
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger" zIndex={99}>
        <Modal.Body>
          <h4>
            <Translate>Confirm deletion</Translate>
          </h4>
          <p>
            <Translate translationKey="Property delete warning">
              Deleting a template property will delete this metadata information on all documents
              using this template.
            </Translate>
          </p>
          <p>
            <Translate>Change will take effect after saving the template</Translate>
          </p>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn btn-default cancel-button"
            onClick={() => this.props.hideModal('RemovePropertyModal')}
          >
            <Translate>Cancel</Translate>
          </button>
          <button
            type="button"
            className="btn btn-danger confirm-button"
            onClick={() => this.confirm()}
          >
            <Translate>Delete Property</Translate>
          </button>
        </Modal.Footer>
      </Modal>
    );
  }
}

RemovePropertyConfirm.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  removeProperty: PropTypes.func,
  propertyBeingDeleted: PropTypes.number,
};

const mapStateToProps = state => {
  const propertyBeingDeleted = state.modals.toJS().RemovePropertyModal;
  return {
    propertyBeingDeleted,
    isOpen: typeof propertyBeingDeleted === 'number',
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ hideModal, removeProperty }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RemovePropertyConfirm);
