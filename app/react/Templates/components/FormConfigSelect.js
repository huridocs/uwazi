import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import { Warning } from 'app/Layout';
import { Translate } from 'app/I18N';
import PropertyConfigOptions from './PropertyConfigOptions';

export class FormConfigSelect extends Component {
  static contentValidation() {
    return { required: val => val.trim() !== '' };
  }

  componentDidMount() {
    this.initialContent = this.props.data.properties[this.props.index].content;
  }

  componentWillReceiveProps(newProps) {
    const newContent = newProps.data.properties[newProps.index].content;
    this.warning = false;
    if (this.initialContent !== newContent) {
      this.warning = true;
    }
  }

  render() {
    const { index, data, formState, type } = this.props;
    const thesauris = this.props.thesauris.toJS();
    const property = data.properties[index];

    const options = thesauris.filter(
      thesauri => thesauri._id !== data._id && thesauri.type !== 'template'
    );

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const contentRequiredError =
      formState.$form.errors[`properties.${index}.content.required`] &&
      formState.$form.submitFailed;
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className={labelClass}>
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>

        <div className={contentRequiredError ? 'form-group has-error' : 'form-group'}>
          <label>
            {t('System', 'Select list')}
            <span className="required">*</span>
          </label>
          {this.warning && (
            <Warning inline>
              <Translate>
                All entities and documents that have already this property assigned will loose its
                current value
              </Translate>
            </Warning>
          )}
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
    formState: state.template.formState,
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
