import React, { Component, PropTypes } from 'react'
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

import InputField from './fields/InputField'
import SelectField from './fields/SelectField'
import CheckBoxField from './fields/CheckBoxField'

class ConfigFieldPanel extends Component {

  constructor(props) {
    super(props)
    this.state = {showModal: false};
    this.fields = {};
  }

  toggleModal = () => {
    this.setState({showModal: !this.state.showModal});
  }

  save = (e) => {
    e.preventDefault();
    this.toggleModal();

    let values = {};

    Object.keys(this.fields).forEach(field_name => {
      if(!this.fields[field_name].value) throw field_name+' has no value function !';
      values[field_name] = this.fields[field_name].value();
    });

    this.props.save(values);
  }

  render = () => {

    let typeOptions = [
      {label: 'Short text', value: 'input'},
      {label: 'Options dropdown', value: 'select'},
      {label: 'Check Box', value: 'checkbox'}
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
                <SelectField label="Type" ref={(ref) => {this.fields.type = ref}} defaultValue={this.props.field.type} options={typeOptions} />
                <InputField label="Label" ref={(ref) => {this.fields.label = ref}} defaultValue={this.props.field.label}/>
                <CheckBoxField label="Required" ref={(ref) => {this.fields.required = ref}} defaultValue={this.props.field.required}/>
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
export default ConfigFieldPanel;
