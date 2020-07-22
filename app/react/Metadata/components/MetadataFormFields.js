import { FormGroup } from 'app/Forms';
import t from 'app/I18N/t';
import { preloadOptionsLimit } from 'shared/config';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Field } from 'react-redux-form';
import { propertyTypes } from 'shared/propertyTypes';
import { getSuggestions } from 'app/Metadata/actions/actions';
import { Translate } from 'app/I18N';
import {
  DatePicker,
  DateRange,
  Geolocation,
  LinkField,
  MarkDown,
  MultiDate,
  MultiDateRange,
  MultiSelect,
  MultiSuggest,
  Nested,
  Numeric,
  Select,
  LookupMultiSelect,
} from '../../ReactReduxForms';
import MultipleEditionFieldWarning from './MultipleEditionFieldWarning';

export const translateOptions = thesauri =>
  thesauri
    .get('values')
    .map(optionIm => {
      const option = optionIm.toJS();
      option.label = t(thesauri.get('_id'), option.label, null, false);
      if (option.values) {
        option.options = option.values.map(val => ({
          ...val,
          label: t(thesauri.get('_id'), val.label, null, false),
        }));
      }
      return option;
    })
    .toJS();

export class MetadataFormFields extends Component {
  getField(property, _model, thesauris) {
    let thesauri;
    let totalPossibleOptions = 0;
    const { dateFormat, version, entityThesauris } = this.props;
    const propertyType = property.type;
    switch (propertyType) {
      case 'select':
        thesauri = thesauris.find(opt => opt.get('_id').toString() === property.content.toString());
        return (
          <Select
            model={_model}
            optionsValue="id"
            options={translateOptions(thesauri)}
            placeholder="Select..."
          />
        );
      case 'multiselect':
        thesauri = thesauris.find(opt => opt.get('_id').toString() === property.content.toString());
        return (
          <MultiSelect
            model={_model}
            optionsValue="id"
            options={translateOptions(thesauri)}
            prefix={_model}
            forceHoist={version === 'OneUp'}
            placeholder={
              version === 'OneUp'
                ? `${t('System', 'Search', null, false)} '${thesauri.get('name')}'`
                : null
            }
          />
        );
      case 'relationship':
        if (property.content) {
          const source = thesauris.find(
            opt => opt.get('_id').toString() === property.content.toString()
          );

          totalPossibleOptions = source.get('optionsCount');
          thesauri = translateOptions(source);
        }

        if (!property.content) {
          thesauri = Array.prototype
            .concat(
              ...thesauris
                .filter(filterThesauri => filterThesauri.get('type') === 'template')
                .map(source => {
                  totalPossibleOptions += source.get('optionsCount');
                  return translateOptions(source);
                })
            )
            .slice(0, preloadOptionsLimit);
        }

        if (entityThesauris.get(property.name)) {
          entityThesauris
            .get(property.name)
            .toJS()
            .forEach(o => {
              thesauri.push({ id: o.value, label: o.label });
            });
        }

        return (
          <LookupMultiSelect
            lookup={getSuggestions.bind(null, property.content ? [property.content] : [])}
            model={_model}
            optionsValue="id"
            options={thesauri}
            totalPossibleOptions={totalPossibleOptions}
            prefix={_model}
            sort
          />
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
            <Field model={_model}>
              <textarea rows="6" className="form-control" />
            </Field>
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
          <Field model={_model}>
            <input type="text" className="form-control" />
          </Field>
        );
      default:
        return false;
    }
  }

  render() {
    const { thesauris, template, multipleEdition, model, showSubset } = this.props;

    const mlThesauri = thesauris
      .filter(thes => !!thes.get('enable_classification'))
      .map(thes => thes.get('_id'))
      .toJS();
    const fields = template.get('properties').toJS();
    const templateID = template.get('_id');

    return (
      <div>
        {fields
          .filter(p => !showSubset || showSubset.includes(p.name))
          .map(property => (
            <FormGroup key={property.name} model={`.metadata.${property.name}`}>
              <ul
                className={`search__filter is-active ${
                  this.props.highlightedProps.includes(property.name) ? 'highlight' : ''
                }`}
              >
                <li className="title">
                  <label>
                    <MultipleEditionFieldWarning
                      multipleEdition={multipleEdition}
                      model={model}
                      field={`metadata.${property.name}`}
                    />
                    {templateID ? (
                      <Translate context={templateID}>{property.label}</Translate>
                    ) : (
                      property.label
                    )}
                    {property.required ? <span className="required">*</span> : ''}
                  </label>
                </li>
                {mlThesauri.includes(property.content) &&
                [propertyTypes.multiselect, propertyTypes.select].includes(property.type) ? (
                  <li className="wide">
                    <MultiSuggest
                      model={`.suggestedMetadata.${property.name}`}
                      selectModel={`.metadata.${property.name}`}
                      propertyType={property.type}
                    />
                  </li>
                ) : null}
                <li className="wide">
                  {this.getField(property, `.metadata.${property.name}`, thesauris)}
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
  version: undefined,
  showSubset: undefined,
  entityThesauris: Immutable.fromJS({}),
  highlightedProps: [],
};

MetadataFormFields.propTypes = {
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  model: PropTypes.string.isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  multipleEdition: PropTypes.bool,
  dateFormat: PropTypes.string,
  showSubset: PropTypes.arrayOf(PropTypes.string),
  version: PropTypes.string,
  entityThesauris: PropTypes.instanceOf(Immutable.Map),
  highlightedProps: PropTypes.arrayOf(PropTypes.string),
};

export const mapStateToProps = state => ({
  dateFormat: state.settings.collection.get('dateFormat'),
  entityThesauris: state.entityThesauris,
});

export default connect(mapStateToProps)(MetadataFormFields);
