import PropTypes from 'prop-types';
import React, {Component} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {Select} from 'app/ReactReduxForms';
import {connect} from 'react-redux';
import {Field} from 'react-redux-form';
import {t} from 'app/I18N';

export class FormConfigRelationship extends Component {

  contentValidation() {
    return {required: (val) => val && val.trim() !== ''};
  }

  render() {
    const {index, data, formState} = this.props;
    const thesauris = this.props.thesauris.toJS();
    const ptoperty = data.properties[index];
    const relationTypes = this.props.relationTypes.toJS();

    const options = thesauris.filter((thesauri) => {
      return thesauri._id !== data._id && thesauri.type === 'template';
    });

    let labelClass = 'form-group';
    let labelKey = `properties.${index}.label`;
    let requiredLabel = formState.$form.errors[labelKey + '.required'];
    let duplicatedLabel = formState.$form.errors[labelKey + '.duplicated'];
    let relationTypeError = formState.$form.errors[`properties.${index}.relationType.required`] && formState.$form.submitFailed;
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

        <div className="form-group">
          <label>{t('System', 'Select list')}</label>
          <Select model={`template.data.properties[${index}].content`}
                  options={options}
                  optionsLabel="name"
                  placeholder="Any entity or document"
                  optionsValue="_id" />
        </div>

        <div className={relationTypeError ? 'form-group has-error' : 'form-group'}>
          <label>{t('System', 'Relationship')}<span className="required">*</span></label>
          <Select model={`template.data.properties[${index}].relationType`}
                  options={relationTypes}
                  optionsLabel="name"
                  validators={this.contentValidation()}
                  optionsValue="_id" />
        </div>

        <Field model={`template.data.properties[${index}].required`}>
          <input id={'required' + this.props.index} type="checkbox"/>
          &nbsp;
          <label className="property-label" htmlFor={'required' + this.props.index}>
            Required property
            <i className="property-help fa fa-question-circle">
              <div className="property-description">You won't be able to publish a document if this property is empty.</div>
            </i>
          </label>
        </Field>

        <Field model={`template.data.properties[${index}].showInCard`}>
          <input id={'showInCard' + this.props.index} type="checkbox"/>
          &nbsp;
          <label className="property-label" htmlFor={'showInCard' + this.props.index}>
            Show in cards
            <i className="property-help fa fa-question-circle">
              <div className="property-description">This property will appear in the library cards as part of the basic info.</div>
            </i>
          </label>
        </Field>

        <div>
          <Field model={`template.data.properties[${index}].filter`}>
            <input id={'filter' + this.props.index} type="checkbox"/>
            &nbsp;
            <label className="property-label" htmlFor={'filter' + this.props.index}>
              Use as filter
              <i className="property-help fa fa-question-circle">
                <div className="property-description">
                  This property will be used for filtering the library results.
                  When properties match in equal name and field type with other document types, they will be combined for filtering.
                </div>
              </i>
            </label>
          </Field>
          <FilterSuggestions {...ptoperty} />
        </div>

      </div>
    );
  }
}

FormConfigRelationship.propTypes = {
  thesauris: PropTypes.object,
  relationTypes: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    relationTypes: state.relationTypes,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigRelationship);
