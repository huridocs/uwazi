import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField} from 'app/Forms';
import {connect} from 'react-redux';

import ShowIf from 'app/App/ShowIf';

export class FormConfigInput extends Component {

  render() {
    const {index, data, formState, type} = this.props;
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
          <div className="col-sm-12">
            <div className={labelClass}>
              <span className="input-group-addon">
                Label
              </span>
              <FormField model={`template.data.properties[${index}].label`}>
                <input className="form-control" />
              </FormField>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.data.properties[${index}].required`}>
                  <input id={'required' + index} type="checkbox"/>
                </FormField>
              </span>
              <label htmlFor={'required' + index} className="form-control">Required</label>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="input-group">
              <span className="input-group-addon">
                <FormField model={`template.data.properties[${index}].showInCard`}>
                  <input id={'showInCard' + this.props.index} type="checkbox"/>
                </FormField>
              </span>
              <label htmlFor={'showInCard' + this.props.index}
                     className="form-control"
                     title="This property will appear in the library cards as part of the basic info.">
                Show in cards
                &nbsp;
                <i className="fa fa-question-circle"></i>
              </label>
            </div>
          </div>
          <ShowIf if={type === 'text' || type === 'date'}>
            <div className="col-sm-4">
              <div className="input-group">
                <span className="input-group-addon">
                  <FormField model={`template.data.properties[${index}].sortable`}>
                    <input id={'sortable' + this.props.index} type="checkbox"/>
                  </FormField>
                </span>
                <label htmlFor={'sortable' + this.props.index}
                  title="Library items will be able to be sorted by this property."
                  className="form-control">
                  Sortable
                  &nbsp;
                  <i className="fa fa-question-circle"></i>
                </label>
              </div>
            </div>
          </ShowIf>
        </div>

        <div className="well-metadata-creator">
          <div>
            <div>
              <FormField model={`template.data.properties[${index}].filter`}>
                <input id={'filter' + this.props.index} type="checkbox"/>
              </FormField>
              &nbsp;
              <label htmlFor={'filter' + this.props.index} title="This property will be used for filtering the library results.
              When properties match in equal name and field type with other document types, they will be combined for filtering.">
                Use as filter
                &nbsp;
                <i className="fa fa-question-circle"></i>
              </label>
            </div>
            <div>
              <FilterSuggestions {...ptoperty} />
            </div>
          </div>

        </div>

      </div>
    );
  }
}

FormConfigInput.propTypes = {
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string,
  type: PropTypes.string
};

export function mapStateToProps({template}) {
  return {
    data: template.data,
    formState: template.formState
  };
}

export default connect(mapStateToProps)(FormConfigInput);
