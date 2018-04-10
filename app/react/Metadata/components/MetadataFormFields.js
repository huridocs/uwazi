import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Immutable from 'immutable';
import {
  FormGroup,
  Select,
  MultiSelect,
  MarkDown,
  DatePicker,
  Nested,
  DateRange,
  MultiDate,
  MultiDateRange,
  Numeric,
  Geolocation
} from 'app/ReactReduxForms';
import { Field } from 'react-redux-form';
import t from 'app/I18N/t';
import { connect } from 'react-redux';
import MultipleEditionFieldWarning from './MultipleEditionFieldWarning';

const translateOptions = thesauri => thesauri.values.map((option) => {
  option.label = t(thesauri._id, option.label);
  return option;
});

export class MetadataFormFields extends Component {
  getField(property, _model, thesauris) {
    let thesauri;
    const propertyType = property.type;
    switch (propertyType) {
    case 'select':
      thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
      return <Select model={_model} optionsValue="id" options={translateOptions(thesauri)}/>;
    case 'multiselect':
      thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
      return <MultiSelect model={_model} optionsValue="id" options={translateOptions(thesauri)} prefix={_model} />;
    case 'relationship':
      if (property.content) {
        thesauri = translateOptions(thesauris.find(opt => opt._id.toString() === property.content.toString()));
      }

      if (!property.content) {
        thesauri = Array.prototype.concat(...thesauris.filter(filterThesauri => filterThesauri.type === 'template').map(translateOptions));
      }
      return <MultiSelect model={_model} optionsValue="id" options={thesauri} prefix={_model} />;
    case 'date':
      return <DatePicker model={_model} format={this.props.dateFormat}/>;
    case 'daterange':
      return <DateRange model={_model} format={this.props.dateFormat}/>;
    case 'numeric':
      return <Numeric model={_model}/>;
    case 'markdown':
      return <MarkDown model={_model}/>;
    case 'nested':
      return <Nested model={_model}/>;
    case 'multidate':
      return <MultiDate model={_model} format={this.props.dateFormat}/>;
    case 'multidaterange':
      return <MultiDateRange model={_model} format={this.props.dateFormat}/>;
    case 'geolocation':
      return <Geolocation model={_model} />;
    default:
      return <Field model={_model}><input className="form-control"/></Field>;
    }
  }

  render() {
    const thesauris = this.props.thesauris.toJS();
    const template = this.props.template.toJS();

    return (
      <div>
        {template.properties.map(property => (
          <FormGroup key={property.name} model={`.metadata.${property.name}`}>
            <ul className="search__filter is-active">
              <li>
                <label>
                  <MultipleEditionFieldWarning
                    multipleEdition={this.props.multipleEdition}
                    model={this.props.model}
                    field={`metadata.${property.name}`}
                  />
                  {t(template._id, property.label)}
                  {property.required ? <span className="required">*</span> : ''}
                </label>
              </li>
              <li className="wide">{this.getField(property, `.metadata.${property.name}`, thesauris)}</li>
            </ul>
          </FormGroup>
          ))}
      </div>
    );
  }
}

MetadataFormFields.defaultProps = {
  multipleEdition: false,
};

MetadataFormFields.propTypes = {
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  model: PropTypes.string.isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  multipleEdition: PropTypes.bool,
  dateFormat: PropTypes.string.isRequired
};

export const mapStateToProps = state => ({
    dateFormat: state.settings.collection.get('dateFormat')
});

export default connect(mapStateToProps)(MetadataFormFields);
