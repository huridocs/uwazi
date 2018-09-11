import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigSelect extends Component {
  static contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  render() {
    const { index, data, formState, type } = this.props;
    const thesauris = this.props.thesauris.toJS();
    const property = data.properties[index];

    const options = thesauris.filter(thesauri => thesauri._id !== data._id && thesauri.type !== 'template');

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const contentRequiredError = formState.$form.errors[`properties.${index}.content.required`] && formState.$form.submitFailed;
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className={labelClass}>
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control"/>
          </Field>
        </div>

        <div className={contentRequiredError ? 'form-group has-error' : 'form-group'}>
          <label>{t('System', 'Select list')}<span className="required">*</span></label>
          <Select
            model={`template.data.properties[${index}].content`}
            options={options}
            optionsLabel="name"
            optionsValue="_id"
          />
        </div>

        <PropertyConfigOptions index={index} property={property} type={type} />

      </div>
    );
  }
}

FormConfigSelect.propTypes = {
  thesauris: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string,
  type: PropTypes.string.isRequired,
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
