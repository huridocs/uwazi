import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField, Select, SelectField} from 'app/Forms';
import {connect} from 'react-redux';

export class FormConfigSelect extends Component {

  nameValidation() {
    return {
      required: (val) => val.trim() !== '',
      duplicated: (val) => {
        return this.props.model.properties.reduce((validity, prop) => {
          let differentLabel = prop.localID === this.props.formKey || prop.label !== val;
          return validity && differentLabel;
        }, true);
      }
    };
  }

  contentValidation() {
    return {required: (val) => val.trim() !== ''};
  }

  render() {
    const {index, ui, model, formState} = this.props;
    const thesauris = ui.toJS().thesauris;
    const ptoperty = model.properties[index];

    let labelClass = 'input-group';
    let labelKey = `properties.${index}.label`;
    let duplicatedLabel = formState.fields[labelKey] && formState.fields[labelKey].errors.duplicated;
    if (formState.fields[labelKey] &&
      !formState.fields[labelKey].valid &&
      (formState.submitFailed || formState.fields[labelKey].dirty || duplicatedLabel)) {
      labelClass += ' has-error';
    }

    let contentClass = 'input-group';
    let contentKey = `properties.${index}.content`;
    if (formState.fields[contentKey] && !formState.fields[contentKey].valid && (formState.submitFailed || formState.fields[contentKey].dirty)) {
      contentClass += ' has-error';
    }

    return (
      <div>
        <div className="row">
          <div className="col-sm-4">
            <div className={labelClass}>
              <span className="input-group-addon">
              {(() => {
                if (duplicatedLabel) {
                  return <span>
                          Duplicated&nbsp;
                          </span>;
                }
              })()}
              Label
              </span>
              <FormField model={`template.model.properties[${index}].label`} validators={this.nameValidation()}>
                <input className="form-control"/>
              </FormField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className={contentClass}>
              <span className="input-group-addon">Thesauri</span>
              <SelectField model={`template.model.properties[${index}].content`}>
                <Select options={thesauris} optionsLabel="name" optionsValue="_id" validators={this.contentValidation()}/>
              </SelectField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.model.properties[${index}].required`}>
                  <input id={'required' + this.props.index} type="checkbox"/>
                </FormField>
              </span>
              <label htmlFor={'required' + this.props.index} className="form-control">Required field</label>
            </div>
          </div>
        </div>
        <div className="well">
          <div className="row">
            <div className="col-sm-4">
              <FormField model={`template.model.properties[${index}].filter`}>
                <input id={'filter' + this.props.index} type="checkbox"/>
              </FormField>
              &nbsp;
              <label htmlFor={'filter' + this.props.index}>Use as library filter</label>
              <small>This property will be used togheter for filtering with other equal to him.</small>
            </div>
            <div className="col-sm-8">
              <FilterSuggestions {...ptoperty} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

FormConfigSelect.propTypes = {
  ui: PropTypes.object,
  model: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    model: state.template.model,
    ui: state.template.uiState,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
