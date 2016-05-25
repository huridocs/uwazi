import React, {Component, PropTypes} from 'react';
// import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField, Select} from 'app/Forms';

export class FormConfigSelect extends Component {
  render() {
    const {index} = this.props;

    return (
      <div>
        <div className="row">
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">Label</span>
              <FormField model={`template.model.properties[${index}].label`}>
                <input className="form-control"/>
              </FormField>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">Thesauri</span>
              <FormField model={`template.model.properties[${index}].content`}>
                <Select options={[]} />
              </FormField>
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
              Filter suggestions commented
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// <FilterSuggestions label={label.value} type={type.value} filter={filter.value} content={content.value} />

FormConfigSelect.propTypes = {
  fields: PropTypes.object,
  values: PropTypes.object,
  thesauris: PropTypes.array,
  index: PropTypes.number
};

export default FormConfigSelect;
