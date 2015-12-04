import React, { Component, PropTypes } from 'react'
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import InputField from '../fields/InputField'
import SelectField from '../fields/SelectField'

class ConfigPanel extends Component {

  constructor(props) {
    super(props)
    this.state = {showModal: false};
  }

  toggleModal = () => {
    this.setState({showModal: !this.state.showModal});
  }

  save = (e) => {
    e.preventDefault();
    this.toggleModal()
    this.props.field.label = this.label.input.value;
    this.props.field.type = this.type.input.value;
    this.props.update(this.props.field);
  }

  render = () => {

    let typeOptions = [
      {label: 'Short text', value: 'text'},
      {label: 'Options dropdown', value: 'select'}
    ];

    return (
        <div className="btn-group col-xs-2">
          <button type="button" className="btn btn-danger" aria-label="Remove"  onClick={this.props.remove}>
            <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </button>
          <button type="button" className="btn btn-default" aria-label="Config" onClick={this.toggleModal}>
            <span className="glyphicon glyphicon-cog" aria-hidden="true"></span>
          </button>
          <Modal show={this.state.showModal}>
            <Modal.Header>
              <Modal.Title>Modal heading</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={this.save} className="form-horizontal">

                <SelectField label="Type" ref={(ref) => {this.type = ref}} defaultValue={this.props.field.type} options={typeOptions} />
                <InputField label="Label" ref={(ref) => {this.label = ref}} defaultValue={this.props.field.label}/>

              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.save} bsStyle="primary">Save</Button>
              <Button onClick={this.toggleModal}>Cancel</Button>
            </Modal.Footer>
          </Modal>
        </div>
    )
  }

}
export default ConfigPanel;
