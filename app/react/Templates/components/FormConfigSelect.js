import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {Select} from 'app/Forms';
import {connect} from 'react-redux';
import {Field} from 'react-redux-form';

export class FormConfigSelect extends Component {

  contentValidation() {
    return {required: (val) => val.trim() !== ''};
  }

  render() {
    const {index, data, formState} = this.props;
    const thesauris = this.props.thesauris.toJS();
    const ptoperty = data.properties[index];

    let optionGroups = [
      {label: 'Dictionaries', options: []},
      {label: 'Entities', options: []}
    ];

    thesauris.filter((thesauri) => {
      return thesauri._id !== data._id;
    }).forEach((thesauri) => {
      if (thesauri.type === 'template') {
        optionGroups[1].options.push(thesauri);
        return;
      }
      optionGroups[0].options.push(thesauri);
    });

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
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control"/>
          </Field>
        </div>

        <div>
          <label>Thesauri</label>
          <SelectField model={`template.data.properties[${index}].content`}>
            <Select options={optionGroups} optionsLabel="name" optionsValue="_id"/>
          </SelectField>
        </div>

        <div>
          <Field model={`template.data.properties[${index}].required`}>
            <input id={'required' + this.props.index} type="checkbox"/>
          </Field>&nbsp;
          <label className="property-label" htmlFor={'required' + this.props.index}>
            Required property
            <i className="property-help fa fa-question-circle">
              <div className="property-description">You won't be able to publish a document if this property is empty.</div>
            </i>
          </label>
        </div>

        <div>
          <Field model={`template.data.properties[${index}].showInCard`}>
            <input id={'showInCard' + this.props.index} type="checkbox"/>
          </Field>&nbsp;
          <label className="property-label" htmlFor={'showInCard' + this.props.index}>
            Show in cards
            <i className="property-help fa fa-question-circle">
              <div className="property-description">This property will appear in the library cards as part of the basic info.</div>
            </i>
          </label>
        </div>

        <div>
          <Field model={`template.data.properties[${index}].filter`}>
            <input id={'filter' + this.props.index} type="checkbox"/>
          </Field>
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
          <FilterSuggestions {...ptoperty} />
        </div>

      </div>
    );
  }
}

FormConfigSelect.propTypes = {
  thesauris: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    thesauris: state.thesauris,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigSelect);
