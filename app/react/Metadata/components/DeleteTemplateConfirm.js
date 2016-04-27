import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {deleteTemplate} from 'app/Templates/actions/templatesActions';
import {hideModal} from 'app/Modals/actions/modalActions';

export class DeleteTemplateConfirm extends Component {

  confirm() {
    this.props.hideModal('DeleteTemplateConfirm');
    this.props.deleteTemplate(this.props.template);
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger">

        <Modal.Body>
          <h4>Are you sure you want to delete <b>{this.props.template.name}</b></h4>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button"
            onClick={() => this.props.hideModal('DeleteTemplateConfirm') }>Cancel</button>
          <button type="button" className="btn btn-danger confirm-button" onClick={() => this.confirm()}>Delete Template</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

DeleteTemplateConfirm.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  deleteTemplate: PropTypes.func,
  template: PropTypes.object
};

const mapStateToProps = (state) => {
  let template = state.modals.toJS().DeleteTemplateConfirm || {};
  return {
    template,
    isOpen: !!template._id
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal, deleteTemplate}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DeleteTemplateConfirm);
