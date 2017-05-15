import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {FormGroup, Select, MultiSelect, MarkDown, DatePicker, Nested, MultiDate, MultiDateRange, Numeric} from 'app/ReactReduxForms';
import {Field} from 'react-redux-form';
import t from 'app/I18N/t';
import {connect} from 'react-redux';
import MultipleEditionFieldWarning from './MultipleEditionFieldWarning';

const translateOptions = (thesauri) => {
  return thesauri.values.map((option) => {
    option.label = t(thesauri._id, option.label);
    return option;
  });
};

const getField = (property, _model, thesauris) => {
  let thesauri;
  const propertyType = property.type;
  switch (propertyType) {
  case 'select':
    thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
    return <Select model={_model} optionsValue='id' options={translateOptions(thesauri)}/>;
  case 'multiselect':
    thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
    return <MultiSelect model={_model} optionsValue='id' options={translateOptions(thesauri)} />;
  case 'date':
    return <DatePicker model={_model}/>;
  case 'numeric':
    return <Numeric model={_model}/>;
  case 'markdown':
    return <MarkDown model={_model}/>;
  case 'nested':
    return <Nested model={_model}/>;
  case 'multidate':
    return <MultiDate model={_model}/>;
  case 'multidaterange':
    return <MultiDateRange model={_model}/>;
  default:
    return <Field model={_model}><input className="form-control"/></Field>;
  }
};

export class MetadataFormFields extends Component {
  render() {
    const thesauris = this.props.thesauris.toJS();
    const template = this.props.template.toJS();
    return (
      <div>
        {template.properties.map((property) => {
          return (
            <FormGroup key={property.name} model={'.metadata.' + property.name}>
              <ul className="search__filter is-active">
                <li>
                  <label>
                    <MultipleEditionFieldWarning
                      multipleEdition={this.props.multipleEdition}
                      model={this.props.model}
                      field={'metadata.' + property.name}
                    />
                    {t(template._id, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                  </label>
                </li>
                <li className="wide">{getField(property, `.metadata.${property.name}`, thesauris, property)}</li>
              </ul>
            </FormGroup>
          );
        })}
      </div>
    );
  }
}

MetadataFormFields.propTypes = {
  template: PropTypes.object,
  model: PropTypes.string,
  state: PropTypes.object,
  thesauris: PropTypes.object,
  multipleEdition: PropTypes.bool
};

export default connect()(MetadataFormFields);
