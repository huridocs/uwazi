import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {FormGroup, Select, MultiSelect, MarkDown, DatePicker, Nested, MultiDate, MultiDateRange, Numeric} from 'app/ReactReduxForms';
import {Field} from 'react-redux-form';
import t from 'app/I18N/t';
import {connect} from 'react-redux';

export class MetadataFormFields extends Component {

  translateOptions(thesauri) {
    return thesauri.values.map((option) => {
      option.label = t(thesauri._id, option.label);
      return option;
    });
  }

  isPristine(field) {
    return field.pristine || field.$form && field.$form.pristine;
  }

  render() {
    const thesauris = this.props.thesauris.toJS();
    const template = this.props.template.toJS();
    return (
      <div>
        {template.properties.map((property) => {
          const getField = (propertyType, _model) => {
            let thesauri;
            switch (propertyType) {
            case 'select':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <Select model={_model} optionsValue='id' options={this.translateOptions(thesauri)}/>;
            case 'multiselect':
              thesauri = thesauris.find((opt) => opt._id.toString() === property.content.toString());
              return <MultiSelect model={_model} optionsValue='id' options={this.translateOptions(thesauri)} />;
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

          // const field = state.metadata[`${property.name}`] || {pristine: true};
          return (
            <FormGroup key={property.name} model={this.props.model} field={'metadata.' + property.name}>
              <ul className="search__filter is-active">
                <li>
                  <label>
                    {t(template._id, property.label)}
                    {property.required ? <span className="required">*</span> : ''}
                  </label>
                </li>
                <li className="wide">{getField(property.type, `.metadata.${property.name}`)}</li>
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
