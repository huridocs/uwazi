import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField} from 'app/Forms';
import {connect} from 'react-redux';

export class FormConfigInput extends Component {

  validation() {
    return {
      required: (val) => val.trim() !== '',
      duplicated: (val) => {
        return this.props.model.properties.reduce((validity, prop) => {
          let differemtLabel = prop.localID !== this.props.localID && prop.label !== val;
          return validity && differemtLabel;
        }, true);
      }
    };
  }

  render() {
    const {index, model, formState} = this.props;
    const ptoperty = model.properties[index];
    let labelClass = 'input-group';
    let labelKey = `properties.${index}.label`;
    if (
      formState.fields[labelKey] &&
      !formState.fields[labelKey].valid &&
      (formState.submitFailed || formState.fields[labelKey].dirty || formState.fields[labelKey].errors.duplicated)) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className="row">
          <div className="col-sm-4">
            <div className={labelClass}>
              <span className="input-group-addon">Label</span>
              <FormField model={`template.model.properties[${index}].label`} validators={this.validation()}>
                <input className="form-control" />
              </FormField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.model.properties[${index}].required`}>
                  <input id={'required' + index} type="checkbox" className="asd"/>
                </FormField>
              </span>
              <label htmlFor={'required' + index} className="form-control">Required field</label>
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

FormConfigInput.propTypes = {
  model: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  localID: PropTypes.string
};

export function mapStateToProps({template}) {
  return {
    model: template.model,
    formState: template.formState
  };
}

export default connect(mapStateToProps)(FormConfigInput);
