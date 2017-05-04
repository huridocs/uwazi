import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Form, Field} from 'react-redux-form';

import {FormGroup} from 'app/ReactReduxForms';
import t from 'app/I18N/t';

export class AttachmentForm extends Component {
  render() {
    const {model} = this.props;
    return (
      <Form id='attachmentForm' model={model} onSubmit={this.props.onSubmit}>
        <FormGroup model={model} field={'originalname'}>
          <ul className="search__filter">
            <li><label>{t('System', 'Filename label', 'Filename')} <span className="required">*</span></label></li>
            <li className="wide">
              <Field model={'.originalname'}>
                <input className="form-control"/>
              </Field>
            </li>
          </ul>
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
