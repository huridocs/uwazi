import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField, Select, SelectField} from 'app/Forms';
import {connect} from 'react-redux';

export class FormConfigSelect extends Component {

  contentValidation() {
    return {required: (val) => val.trim() !== ''};
  }

  render() {
    const {index, ui, data, formState} = this.props;
    const thesauris = ui.toJS().thesauris;
    const ptoperty = data.properties[index];

    let labelClass = 'input-group';
    let labelKey = `properties.${index}.label`;
    let requiredLabel = formState.errors[labelKey + '.required'];
    let duplicatedLabel = formState.errors[labelKey + '.duplicated'];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>
        <div className="row">
          <div className="col-sm-4">
            <div className={labelClass}>
              <span className="input-group-addon">
              Label
              </span>
              <FormField model={`template.data.properties[${index}].label`}>
                <input className="form-control"/>
              </FormField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">Thesauri</span>
              <SelectField model={`template.data.properties[${index}].content`}>
                <Select options={thesauris} optionsLabel="name" optionsValue="_id"/>
              </SelectField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.data.properties[${index}].required`}>
                  <input id={'required' + this.props.index} type="checkbox"/>
                </FormField>
              </span>
              <label htmlFor={'required' + this.props.index} className="form-control">Required field</label>
            </div>
          </div>
        </div>
        {(() => {
          if (duplicatedLabel) {
            return <div className="row has-error">
                    <div className="col-sm-4">
                    <i className="fa fa-exclamation-triangle"></i>
                      &nbsp;
                      Duplicated label
                    </div>
                  </div>;
          }
        })()}
        <div className="well">
          <div className="row">
            <div className="col-sm-4">
              <FormField model={`template.data.properties[${index}].filter`}>
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
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    ui: state.template.uiState,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
