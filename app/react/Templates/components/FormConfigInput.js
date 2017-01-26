import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {Field} from 'react-redux-form';
import {connect} from 'react-redux';

import PrioritySortingLabel from './PrioritySortingLabel';

import ShowIf from 'app/App/ShowIf';

export class FormConfigInput extends Component {

  render() {
    const {index, data, formState, type} = this.props;
    const property = data.properties[index];
    let labelClass = '';
    let labelKey = `properties.${index}.label`;
    let requiredLabel = formState.$form.errors[labelKey + '.required'];
    let duplicatedLabel = formState.$form.errors[labelKey + '.duplicated'];
    if (requiredLabel || duplicatedLabel) {
      labelClass += ' has-error';
    }

    return (
      <div>

        <div className={labelClass}>
          <label>Name</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control" />
          </Field>
        </div>

        <Field model={`template.data.properties[${index}].required`}>
          <input id={'required' + index} type="checkbox"/>
          &nbsp;
          <label className="property-label" htmlFor={'required' + index}>
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
              <div className="property-description">Show this property in the cards as part of the basic info.</div>
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
                  Use this property to filter the library results.
                  When properties match in equal name and field type with other document types, they will be combined for filtering.
                  Also library items will be able to be sorted by this property.
                </div>
              </i>
            </label>
          </Field>
          <FilterSuggestions {...property} />
        </div>

        <ShowIf if={type === 'text' || type === 'date'}>
          <Field model={`template.data.properties[${index}].prioritySorting`}>
            <input id={'prioritySorting' + this.props.index} type="checkbox" disabled={!property.filter} />
            &nbsp;
            <PrioritySortingLabel htmlFor={'prioritySorting' + this.props.index} />
          </Field>
        </ShowIf>
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
