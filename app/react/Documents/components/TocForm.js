import React, {Component, PropTypes} from 'react';
import {Form} from 'react-redux-form';

import {FormGroup, FormField} from 'app/Forms';

export class TocForm extends Component {
  render() {
    return (
      <Form id='tocForm' model={this.props.model} onSubmit={this.props.onSubmit} >
        {this.props.toc.map((tocElement, index) => {
          return (
            <FormGroup key={index} {...this.props.state.fields[index]} submitFailed={this.props.state.submitFailed}>
              <FormField model={`${this.props.model}[${index}].label`} >
                <input className="form-control"/>
              </FormField>
              <a className="btn btn-xs btn-danger">
                <i className="fa fa-trash"></i>
              </a>
            </FormGroup>
            );
        })}
      </Form>
    );
  }
}

TocForm.propTypes = {
  toc: PropTypes.array,
  model: PropTypes.string.isRequired,
  state: PropTypes.object,
  onSubmit: PropTypes.func
};

export default TocForm;
