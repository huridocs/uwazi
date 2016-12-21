import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {Field} from 'react-redux-form';
import {connect} from 'react-redux';

import ShowIf from 'app/App/ShowIf';

export class FormConfigInput extends Component {

  render() {
    const {index, data, formState, type} = this.props;
    const ptoperty = data.properties[index];
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

        <div>
          <Field model={`template.data.properties[${index}].required`}>
            <input id={'required' + index} type="checkbox"/>
          </Field>&nbsp;
          <label htmlFor={'required' + index}>Required property</label>
          <p className="property-description">You won't be able to publish a document if this property is empty.</p>
        </div>

        <div>
          <Field model={`template.data.properties[${index}].showInCard`}>
            <input id={'showInCard' + this.props.index} type="checkbox"/>
          </Field>&nbsp;
          <label htmlFor={'showInCard' + this.props.index}>Show in cards</label>
          <p className="property-description">Show this property in the cards as part of the basic info.</p>
        </div>

        <div>
          <div>
            <div>
              <Field model={`template.data.properties[${index}].filter`}>
                <input id={'filter' + this.props.index} type="checkbox"/>
              </Field>
              &nbsp;
              <label htmlFor={'filter' + this.props.index}>Use as filter</label>
              <p className="property-description">
                Use this property to filter the library results.
                When properties match in equal name and field type with other document types, they will be combined for filtering.
                Also library items will be able to be sorted by this property.
              </p>
              <FilterSuggestions {...ptoperty} />
            </div>
          </div>
          <div>
            <FormField model={`template.data.properties[${index}].filter`}>
              <input id={'filter' + this.props.index} type="checkbox"/>
            </FormField>
            &nbsp;
            <label htmlFor={'filter' + this.props.index}>Set as default sorting</label>
            <p className="property-description">
              This property will try to be used as default sorting.
              If there's more than one property available to sort documents, those documents will be sorted
              by this property by default.</p>
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
