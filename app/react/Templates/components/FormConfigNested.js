import React, {Component, PropTypes} from 'react';
import FilterSuggestions from 'app/Templates/components/FilterSuggestions';
import {FormField} from 'app/Forms';
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
              <span className="input-group-addon">
                <FormField model={`template.data.properties[${index}].required`}>
                  <input id={'required' + this.props.index} type="checkbox"/>
                </FormField>
              </span>
              <label htmlFor={'required' + this.props.index} className="form-control">Required</label>
            </div>
          </div>
        </div>
        <div>Properties <button className="btn btn-primary" onClick={this.addProperty.bind(this)}>Add</button></div>
        {(() => {
          return this.state.nestedProperties.map((nestedProp, nestedIndex) => {
            return <div key={nestedIndex} className="row">
              <div className="col-sm-4">
                <div className="input-group">
                  <span className="input-group-addon">Key</span>
                  <FormField model={`template.data.properties[${index}].nestedProperties[${nestedIndex}].key`}>
                    <input className="form-control"/>
                  </FormField>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="input-group">
                  <span className="input-group-addon">Label</span>
                  <FormField model={`template.data.properties[${index}].nestedProperties[${nestedIndex}].label`}>
                    <input className="form-control"/>
                  </FormField>
                </div>
              </div>
              <div className="col-sm-2">
                <button className="btn btn-danger" onClick={this.removeProperty.bind(this, nestedIndex)}>Remove</button>
              </div>
            </div>;
          });
        })()}
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

        <div className="well well-metadata-creator">
          <div className="row">
            <div className="col-sm-4">
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
            <div className="col-sm-8 border-bottom">
              <FilterSuggestions {...property} />
            </div>
          </div>

          <div className="row">
            <div className="col-sm-4">
              <FormField model={`template.data.properties[${index}].showInCard`}>
                <input id={'showInCard' + this.props.index} type="checkbox"/>
              </FormField>
              &nbsp;
              <label htmlFor={'showInCard' + this.props.index}
                     title="This property will appear in the library cards as part of the basic info.">
                Show in cards
                &nbsp;
                <i className="fa fa-question-circle"></i>
              </label>
            </div>
            <div className="col-sm-8 help">
              Show this property in the library card's basic info.
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
