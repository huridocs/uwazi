/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { FormGroup } from 'app/Forms';
import { t, Translate } from 'app/I18N';
import { preloadOptionsLimit } from 'shared/config';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ID from 'shared/uniqueID';
import { connect } from 'react-redux';
import { Field, actions as formActions } from 'react-redux-form';
import { propertyTypes } from 'shared/propertyTypes';
import { getSuggestions } from 'app/Metadata/actions/actions';
import { generateID } from 'shared/IDGenerator';
import { bindActionCreators } from 'redux';
import Tip from 'app/Layout/Tip';

import { saveThesaurus } from 'app/Thesauri/actions/thesauriActions';
import { sanitizeThesauri } from 'app/Thesauri/components/ThesauriForm';
import { NeedAuthorization } from 'app/Auth';
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
  MediaField,
} from '../../ReactReduxForms';
import MultipleEditionFieldWarning from './MultipleEditionFieldWarning';
import { MediaModalType } from './MediaModal';
import { MetadataExtractor } from './MetadataExtractor';
import { DeleteSelectionButton } from './DeleteSelectionButton';
import { AddThesauriValueButton } from './AddThesauriValueButton';

const translateOptions = thesauri =>
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

const groupSameRelationshipFields = fields =>
  fields
    .map(field => {
      if (field.type !== 'relationship') {
        return field;
      }

      const multiEditingRelationshipFields = fields.filter(
        f =>
          f.content === field.content &&
          f.relationType === field.relationType &&
          f._id !== field._id
      );

      if (multiEditingRelationshipFields.length) {
        return {
          ...field,
          multiEditingRelationshipFields,
        };
      }

      return field;
    })
    .filter(f => f);

class MetadataFormFields extends Component {
  async onAddThesauriValueSaved(thesauri, newValue, _model, isMultiSelect) {
    const { model, push, change } = this.props;
    const newThesauri = thesauri.toJS();
    const newValueItem = { label: newValue.value, id: ID() };
    if (newValue.group === 'root') {
      newThesauri.values.push(newValueItem);
    } else {
      newThesauri.values.forEach(value => {
        if (value.id === newValue.group) {
          value.values.push(newValueItem);
        }
      });
    }
    const sanitizedThesauri = sanitizeThesauri(newThesauri);
    await this.props.saveThesaurus(sanitizedThesauri);
    const formModel = `${model}${_model}`;
    if (isMultiSelect) {
      push(formModel, newValueItem.id);
    } else {
      change(formModel, newValueItem.id);
    }
  }

  getField(property, _model, thesauris, formModel) {
    let thesauri;
    let totalPossibleOptions = 0;
    const {
      dateFormat,
      version,
      entityThesauris,
      attachments,
      localAttachments,
      multipleEdition,
      locale,
      model,
    } = this.props;
    const propertyType = property.type;
    const plainAttachments = attachments.toJS();
    const plainLocalAttachments = localAttachments;
    const isPublicForm = model === 'publicform';

    switch (propertyType) {
      case 'select':
        thesauri = thesauris.find(opt => opt.get('_id').toString() === property.content.toString());
        return (
          <>
            {!isPublicForm && (
              <NeedAuthorization roles={['admin']}>
                <AddThesauriValueButton
                  values={translateOptions(thesauri)}
                  onModalAccept={async newValue => {
                    await this.onAddThesauriValueSaved(thesauri, newValue, _model, false);
                  }}
                />
              </NeedAuthorization>
            )}
            <Select
              model={_model}
              optionsValue="id"
              options={translateOptions(thesauri)}
              placeholder="Select..."
            />
          </>
        );
      case 'multiselect':
        thesauri = thesauris.find(opt => opt.get('_id').toString() === property.content.toString());
        return (
          <>
            {!isPublicForm && (
              <NeedAuthorization roles={['admin']}>
                <AddThesauriValueButton
                  values={translateOptions(thesauri)}
                  onModalAccept={async newValue => {
                    await this.onAddThesauriValueSaved(thesauri, newValue, _model, true);
                  }}
                />
              </NeedAuthorization>
            )}
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
          </>
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
            onChange={this.relationshipChange.bind(this, property)}
            sort
          />
        );
      case 'date':
        return <DatePicker model={_model} format={dateFormat} locale={locale} />;
      case 'daterange':
        return <DateRange model={_model} format={dateFormat} locale={locale} />;
      case 'numeric':
        return <Numeric model={_model} />;
      case 'markdown':
        return <MarkDown model={_model} />;
      case 'nested':
        return <Nested model={_model} />;
      case 'multidate':
        return <MultiDate model={_model} format={dateFormat} locale={locale} />;
      case 'multidaterange':
        return <MultiDateRange model={_model} format={dateFormat} locale={locale} />;
      case 'geolocation':
        return <Geolocation model={_model} />;
      case 'link':
        return <LinkField model={_model} />;
      case 'media':
        return (
          <MediaField
            model={_model}
            formModel={formModel}
            attachments={plainAttachments}
            localAttachments={plainLocalAttachments}
            type={MediaModalType.Media}
            multipleEdition={multipleEdition}
          />
        );
      case 'image':
        return (
          <MediaField
            model={_model}
            formModel={formModel}
            attachments={plainAttachments}
            localAttachments={plainLocalAttachments}
            type={MediaModalType.Image}
            multipleEdition={multipleEdition}
          />
        );
      case 'preview':
        return (
          <div>
            <em>
              <Translate>This content is automatically generated</Translate>
            </em>
          </div>
        );
      case 'generatedid':
        return (
          <Field model={_model}>
            <input
              type="text"
              className="form-control"
              defaultValue={formModel === 'publicform' ? generateID(3, 4, 4) : undefined}
            />
          </Field>
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

  relationshipChange(prop, value) {
    const { change, model } = this.props;
    prop.multiEditingRelationshipFields?.forEach(p => {
      change(`${model}.metadata.${p.name}`, value);
    });
  }

  renderLabel(property) {
    const { template, multipleEdition, model } = this.props;
    const templateID = template.get('_id');
    let label = templateID ? (
      <Translate context={templateID}>{property.label}</Translate>
    ) : (
      property.label
    );

    if (property.multiEditingRelationshipFields) {
      label = (
        <>
          <Translate context={templateID}>{property.label}</Translate>
          &nbsp;(
          <Translate>
            Multiple inherited properties warning ([property 1] affects [property 2])
          </Translate>
          &nbsp;
          {property.multiEditingRelationshipFields.map(p => (
            <span key={p._id}>
              &quot;<Translate context={templateID}>{p.label}</Translate>&quot;&nbsp;
            </span>
          ))}
          )
          <Tip icon="info-circle" position="left">
            <p>
              <Translate translationKey="Multiple relationships edit description">
                Making changes to this property will affect other properties on this template
                because they all share relationships with the same configuration.
              </Translate>
            </p>
          </Tip>
        </>
      );
    }

    return (
      <li className="title">
        <label>
          <MultipleEditionFieldWarning
            multipleEdition={multipleEdition}
            model={model}
            field={`metadata.${property.name}`}
          />
          {label}
          {property.required ? <span className="required">*</span> : ''}
        </label>
      </li>
    );
  }

  render() {
    const { thesauris, template, model, showSubset, storeKey, pdfLanguage, locale } = this.props;

    const mlThesauri = thesauris
      .filter(thes => !!thes.get('enable_classification'))
      .map(thes => thes.get('_id'))
      .toJS();
    const fields = groupSameRelationshipFields(template.get('properties').toJS());
    return (
      <div>
        {fields
          .filter(p => !showSubset || showSubset.includes(p.name))
          .map(property => {
            const showIXButtons =
              storeKey === 'documentViewer' &&
              ['text', 'date', 'numeric', 'markdown'].includes(property.type);
            return (
              <FormGroup
                key={property.name}
                model={`.metadata.${property.name}`}
                className={
                  model === 'publicform' && property.type === 'generatedid'
                    ? ' hidden '
                    : property.type
                }
              >
                <ul
                  className={`search__filter is-active ${
                    this.props.highlightedProps.includes(property.name) ? 'highlight' : ''
                  }`}
                >
                  {this.renderLabel(property)}
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
                    <div className="metadata-extractor-container">
                      {showIXButtons && (
                        <MetadataExtractor
                          fieldName={property.name}
                          fieldId={property._id}
                          fieldType={property.type}
                          model={`${model}.metadata.${property.name}`}
                          locale={pdfLanguage || locale}
                        />
                      )}
                      {this.getField(property, `.metadata.${property.name}`, thesauris, model)}
                    </div>
                  </li>
                  {showIXButtons && (
                    <DeleteSelectionButton propertyName={property.name} propertyID={property._id} />
                  )}
                </ul>
              </FormGroup>
            );
          })}
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
  attachments: Immutable.fromJS([]),
  highlightedProps: [],
  localAttachments: [],
  storeKey: '',
  locale: '',
  pdfLanguage: '',
};

MetadataFormFields.propTypes = {
  saveThesaurus: PropTypes.func.isRequired,
  template: PropTypes.instanceOf(Immutable.Map).isRequired,
  model: PropTypes.string.isRequired,
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  storeKey: PropTypes.string,
  multipleEdition: PropTypes.bool,
  dateFormat: PropTypes.string,
  showSubset: PropTypes.arrayOf(PropTypes.string),
  version: PropTypes.string,
  entityThesauris: PropTypes.instanceOf(Immutable.Map),
  highlightedProps: PropTypes.arrayOf(PropTypes.string),
  attachments: PropTypes.instanceOf(Immutable.List),
  localAttachments: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  change: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  locale: PropTypes.string,
  pdfLanguage: PropTypes.string,
};

export const mapStateToProps = (state, ownProps) => {
  const { storeKey } = ownProps;

  let attachments = Immutable.fromJS([]);
  let localAttachments;
  let pdfLanguage;

  if (storeKey === 'library') {
    const selectedDocuments = state.library.ui.get('selectedDocuments');
    attachments = selectedDocuments.size ? selectedDocuments.get(0).get('attachments') : undefined;
    localAttachments = state.library.sidepanel.metadata.attachments;
  }

  if (storeKey === 'documentViewer') {
    const entity = state[storeKey].doc;
    pdfLanguage = entity.get('defaultDoc')?.get('language');
    attachments = entity.get('attachments');
    localAttachments = state[storeKey].sidepanel.metadata.attachments;
  }

  if (!storeKey) {
    const { entity } = state.entityView;
    attachments = entity.get('attachments');
    localAttachments = state.entityView.entityForm.attachments;
  }

  const { locale } = state;
  return {
    dateFormat: state.settings.collection.get('dateFormat'),
    entityThesauris: state.entityThesauris,
    attachments,
    localAttachments,
    locale,
    pdfLanguage,
  };
};

export const mapDispatchToProps = (dispatch, ownProps) => {
  if (ownProps.boundChange) {
    return { change: ownProps.boundChange };
  }
  return bindActionCreators(
    { saveThesaurus, change: formActions.change, push: formActions.push },
    dispatch
  );
};

export { MetadataFormFields, translateOptions };
export default connect(mapStateToProps, mapDispatchToProps)(MetadataFormFields);
