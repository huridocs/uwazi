import { Field } from 'react-redux-form';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { Select } from 'app/ReactReduxForms';
import { t } from 'app/I18N';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';

export class FormConfigRelationship extends Component {
  static contentValidation() {
    return { required: val => val && val.trim() !== '' };
  }

  render() {
    const { index, data, formState } = this.props;
    const property = data.properties[index];
    const relationTypes = this.props.relationTypes.toJS();

    let labelClass = 'form-group';
    const labelKey = `properties.${index}.label`;
    const requiredLabel = formState.$form.errors[`${labelKey}.required`];
    const duplicatedLabel = formState.$form.errors[`${labelKey}.duplicated`];
    const relationTypeError =
      formState.$form.errors[`properties.${index}.relationType.required`] &&
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
        <div className={relationTypeError ? 'form-group has-error' : 'form-group'}>
          <label>
            {t('System', 'Relationship type')}
            <span className="required">*</span>
          </label>
          <Select
            model={`template.data.properties[${index}].relationType`}
            options={relationTypes}
            optionsLabel="name"
            validators={FormConfigRelationship.contentValidation()}
            optionsValue="_id"
          />
        </div>

        <div>
          <Field className="filter" model={`template.data.properties[${index}].filter`}>
            <input id={`filter${this.props.index}`} type="checkbox" checked="checked" disabled />
            &nbsp;
            <label className="property-label" htmlFor={`filter${this.props.index}`}>
              Use as filter
            </label>
          </Field>
          <FilterSuggestions {...property} />
        </div>
      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  relationTypes: PropTypes.instanceOf(Immutable.List).isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  formState: PropTypes.object.isRequired,
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    relationTypes: state.relationTypes,
    formState: state.template.formState,
  };
}

export default connect(mapStateToProps)(FormConfigRelationship);
