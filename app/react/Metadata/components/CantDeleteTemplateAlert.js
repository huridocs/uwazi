import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideModal} from 'app/Modals/actions/modalActions';

export class CantDeleteTemplateAlert extends Component {

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger">

        <Modal.Body>
          <h4>this template can not be deleted, has <b>{this.props.documents} documents using it !</b></h4>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-danger" onClick={() => this.props.hideModal('CantDeleteTemplateAlert')}>OK</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

CantDeleteTemplateAlert.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  documents: PropTypes.number
};

const mapStateToProps = (state) => {
  let documents = state.modals.toJS().CantDeleteTemplateAlert;
  return {
    documents,
    isOpen: typeof documents === 'number'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CantDeleteTemplateAlert);
