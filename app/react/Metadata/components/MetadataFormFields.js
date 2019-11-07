/** @format */

import { FormGroup } from 'app/Forms';
import { WrappedControl } from 'app/Forms/components/MetadataUtil';
import t from 'app/I18N/t';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Control } from 'react-redux-form';
import {
  DatePicker,
  DateRange,
  Geolocation,
  LinkField,
  MarkDown,
  MultiDate,
  MultiDateRange,
  MultiSelect,
  Nested,
  Numeric,
  Select,
} from '../../ReactReduxForms';
import MultipleEditionFieldWarning from './MultipleEditionFieldWarning';

const translateOptions = thesauri =>
  thesauri.values.map(option => {
    option.label = t(thesauri._id, option.label, null, false);
    if (option.values) {
      option.options = option.values.map(val => {
        val.label = t(thesauri._id, val.label, null, false);
        return val;
      });
    }
    return option;
  });

export class MetadataFormFields extends Component {
  getField(property, _model, thesauris) {
    let thesauri;
    const { dateFormat } = this.props;
    const propertyType = property.type;
    switch (propertyType) {
      case 'select':
        thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
        return <Select model={_model} optionsValue="id" options={translateOptions(thesauri)} />;
      case 'multiselect':
        thesauri = thesauris.find(opt => opt._id.toString() === property.content.toString());
        return (
          <MultiSelect
            model={_model}
            optionsValue="id"
            options={translateOptions(thesauri)}
            prefix={_model}
          />
        );
      case 'relationship':
        if (property.content) {
          const source = thesauris.find(opt => opt._id.toString() === property.content.toString());
          thesauri = translateOptions(source);
        }

        if (!property.content) {
          thesauri = Array.prototype.concat(
            ...thesauris
              .filter(filterThesauri => filterThesauri.type === 'template')
              .map(translateOptions)
          );
        }
        return (
          <MultiSelect model={_model} optionsValue="id" options={thesauri} prefix={_model} sort />
        );
      case 'date':
        return <DatePicker model={_model} format={dateFormat} />;
      case 'daterange':
        return <DateRange model={_model} format={dateFormat} />;
      case 'numeric':
        return <Numeric model={_model} />;
      case 'markdown':
        return <MarkDown model={_model} />;
      case 'nested':
        return <Nested model={_model} />;
      case 'multidate':
        return <MultiDate model={_model} format={dateFormat} />;
      case 'multidaterange':
        return <MultiDateRange model={_model} format={dateFormat} />;
      case 'geolocation':
        return <Geolocation model={_model} />;
      case 'link':
        return <LinkField model={_model} />;
      case 'media':
      case 'image':
        return (
          <div>
            <Control model={_model} component={WrappedControl}>
              <textarea rows="6" className="form-control" />
            </Control>
            &nbsp;<em>URL (address for image or media file)</em>
          </div>
        );
      case 'preview':
        return (
          <div>
            <em>This content is automatically generated</em>
          </div>
        );
      case 'text':
        return (
          <Control model={_model} component={WrappedControl}>
            <input type="text" className="form-control" />
          </Control>
        );
      default:
        return false;
    }
  }

  render() {
    const { thesauris, template, multipleEdition, model } = this.props;
    const fields = template.get('properties').toJS();
    const templateID = template.get('_id');

    return (
      <div>
        {fields.map(property => (
          <FormGroup key={property.name} model={`.metadata.${property.name}`}>
            <ul className="search__filter is-active">
              <li>
                <label>
                  <MultipleEditionFieldWarning
                    multipleEdition={multipleEdition}
                    model={model}
                    field={`metadata.${property.name}`}
                  />
                  {t(templateID, property.label)}
                  {property.required ? <span className="required">*</span> : ''}
                </label>
              </li>
              <li className="wide">
                {this.getField(property, `.metadata.${property.name}`, thesauris.toJS())}
              </li>
            </ul>
          </FormGroup>
        ))}
      </div>
    );
  }
}

MetadataFormFields.defaultProps = {
  multipleEdition: false,
  dateFormat: null,
};

MetadataFormFields.propTypes = {
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  model: PropTypes.string.isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  multipleEdition: PropTypes.bool,
  dateFormat: PropTypes.string,
};

export const mapStateToProps = state => ({
  dateFormat: state.settings.collection.get('dateFormat'),
});

export default connect(mapStateToProps)(MetadataFormFields);
