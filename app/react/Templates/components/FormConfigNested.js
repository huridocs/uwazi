import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {Field} from 'react-redux-form';
import {connect} from 'react-redux';

export class FormConfigNested extends Component {

  constructor(props) {
    super(props);
    const nestedProperties = props.data.properties[props.index].nestedProperties || [{key: '', label: ''}];
    this.state = {nestedProperties};
  }

  contentValidation() {
    return {required: (val) => val.trim() !== ''};
  }

  addProperty(e) {
    e.preventDefault();
    let nestedProperties = this.state.nestedProperties.slice();
    nestedProperties.push({key: '', label: ''});
    this.setState({nestedProperties});
  }

  removeProperty(index, e) {
    e.preventDefault();
    let nestedProperties = this.state.nestedProperties.slice();
    nestedProperties.splice(index, 1);
    this.setState({nestedProperties});
  }

  render() {
    const {index, data, formState} = this.props;
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
          <label>Label</label>
          <Field model={`template.data.properties[${index}].label`}>
            <input className="form-control"/>
          </Field>
        </div>

        <div>
          <span>
            <Field model={`template.data.properties[${index}].required`}>
              <input id={'required' + this.props.index} type="checkbox"/>
            </Field>&nbsp;
          </span>
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
              <div className="property-description">
                This property will appear in the library cards as part of the basic info.
              </div>
            </i>
          </label>
        </div>

        <div className="nestedProperties well-metadata-creator">
          <p>Properties</p>
          {(() => {
            return this.state.nestedProperties.map((nestedProp, nestedIndex) => {
              return <div key={nestedIndex}>
                <div className="input-group">
                  <span className="input-group-addon">Key</span>
                  <Field model={`template.data.properties[${index}].nestedProperties[${nestedIndex}].key`}>
                    <input className="form-control"/>
                  </Field>
                  <span className="input-group-addon">Label</span>
                  <Field model={`template.data.properties[${index}].nestedProperties[${nestedIndex}].label`}>
                    <input className="form-control"/>
                  </Field>
                  <span className="input-group-btn">
                    <button className="btn btn-danger" onClick={this.removeProperty.bind(this, nestedIndex)}>
                      <i className="fa fa-trash"></i>
                    </button>
                  </span>
                </div>
              </div>;
            });
          })()}

          <div>
            <button className="btn btn-success" onClick={this.addProperty.bind(this)}>
              <i className="fa fa-plus"></i>
              <span>Add property</span>
            </button>
          </div>
        </div>

        <div className="well-metadata-creator">
          <div>
            <div>
              <Field model={`template.data.properties[${index}].filter`}>
                <input id={'filter' + this.props.index} type="checkbox"/>
              </Field>
              &nbsp;
              <label className="property-label" htmlFor={'filter' + this.props.index}>
                Use as filter
                <i className="property-help fa fa-question-circle">
                  <div className="property-description">This property will be used for filtering the library results.
                  When properties match in equal name and field type with other document types, they will be combined for filtering.</div>
                </i>
              </label>
            </div>
            <div>
              <FilterSuggestions {...property} />
            </div>
          </div>
        </div>

      </div>
    );
  }
}

FormConfigNested.propTypes = {
  thesauris: PropTypes.object,
  data: PropTypes.object,
  index: PropTypes.number,
  formState: PropTypes.object,
  formKey: PropTypes.string
};

export function mapStateToProps(state) {
  return {
    data: state.template.data,
    formState: state.template.formState
  };
}

export default connect(mapStateToProps)(FormConfigNested);
