import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal';

class InputConfigButtons extends Component {

  constructor(props) {
    super(props)
    this.state = {isOpen: false};
  }

  toggleModal = () => {
    this.setState({isOpen: !this.state.isOpen});
  }

  render = () => {
    return (
        <div className="col-lg-2 btn-group">
          <button type="button" className="btn btn-danger" aria-label="Remove"  onClick={this.props.remove}>
            <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Config" onClick={this.toggleModal}>
            <span className="glyphicon glyphicon-cog" aria-hidden="true"></span>
          </button>

          <Modal isOpen={this.state.isOpen} className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 className="modal-title" id="myModalLabel">Modal title</h4>
              </div>
              <div className="modal-body">
                ...yaf
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={this.toggleModal}>Close</button>
                <button type="button" className="btn btn-primary">Save changes</button>
              </div>
            </div>
          </Modal>

        </div>
    )
  }

}
export default InputConfigButtons;
