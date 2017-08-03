import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Form, Field} from 'react-redux-form';

import {FormGroup} from 'app/ReactReduxForms';

export class AttachmentForm extends Component {
  render() {
    const {model} = this.props;
    const validators = {originalname: {required: val => !!val && val.trim() !== ''}};
    return (
      <Form id='attachmentForm' model={model} onSubmit={this.props.onSubmit} validators={validators}>
        <FormGroup model={model} field={'originalname'}>
          <Field model={'.originalname'}>
            <input className="form-control"/>
          </Field>
        </FormGroup>
      </Form>
    );
  }
}

AttachmentForm.propTypes = {
  model: PropTypes.string.isRequired,
  onSubmit: PropTypes.func
};

export default connect()(AttachmentForm);
