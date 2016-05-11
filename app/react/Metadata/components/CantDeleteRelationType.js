import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import Modal from 'app/Layout/Modal';

import {hideModal} from 'app/Modals/actions/modalActions';

export class CantDeleteRelationType extends Component {

  render() {
    return (
      <Modal isOpen={this.props.isOpen || false} type="danger">

        <Modal.Body>
          <h4>You can't delete relation types with references associated.</h4>
          <p>
            There are {this.props.references} references using this relation type.
            Change these references's relation type or delete them before attempting to delete this relation type.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <button type="button" className="btn btn-danger" onClick={() => this.props.hideModal('CantDeleteRelationType')}>OK</button>
        </Modal.Footer>

      </Modal>
    );
  }
}

CantDeleteRelationType.propTypes = {
  isOpen: PropTypes.bool,
  hideModal: PropTypes.func,
  references: PropTypes.number
};

const mapStateToProps = (state) => {
  let references = state.modals.toJS().CantDeleteRelationType;
  return {
    references,
    isOpen: typeof references === 'number'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({hideModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CantDeleteRelationType);
