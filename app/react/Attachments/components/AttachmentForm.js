import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Form, Field} from 'react-redux-form';

import {FormGroup, Select} from 'app/ReactReduxForms';
import {languages} from 'shared/languagesList';
import t from 'app/I18N/t';
import ShowIf from 'app/App/ShowIf';

export class AttachmentForm extends Component {
  render() {
    const {model} = this.props;
    const validators = {originalname: {required: val => !!val && val.trim() !== ''}};
    const languageOptions = Object.keys(languages).map((key) => {
      return {value: languages[key].franc, label: languages[key].elastic};
    });
    languageOptions.push({value: 'other', label: 'Other'});

    return (
      <Form id='attachmentForm' model={model} onSubmit={this.props.onSubmit} validators={validators}>
        <FormGroup model={model} field={'originalname'}>
          <Field model={'.originalname'}>
            <input className="form-control"/>
          </Field>
        </FormGroup>
        <ShowIf if={this.props.isSourceDocument}>
          <FormGroup className="set-language">
              <label>{t('System', 'Language')}</label>
              <Select
                model={'.language'}
                className="form-control"
                options={languageOptions}
              />
          </FormGroup>
          </ShowIf>
      </Form>
    );
  }
}

AttachmentForm.propTypes = {
  model: PropTypes.string.isRequired,
  isSourceDocument: PropTypes.bool,
  onSubmit: PropTypes.func
};

export default connect()(AttachmentForm);
