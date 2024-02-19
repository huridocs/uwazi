import { actions as formActions, getModel } from 'react-redux-form';

import { advancedSort } from 'app/utils/advancedSort';
import { api } from 'app/Entities';
import { notificationActions } from 'app/Notifications';
import { t } from 'app/I18N';
import { removeDocuments, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { reloadThesauri } from 'app/Thesauri/actions/thesaurisActions';
import { RequestParams } from 'app/utils/RequestParams';
import searchAPI from 'app/Search/SearchAPI';
import { actions } from 'app/BasicReducer';
import { generateID } from 'shared/IDGenerator';
import emptyTemplate from '../helpers/defaultTemplate';

function resetReduxForm(form) {
  return formActions.reset(form);
}

const propertyExists = (property, previousTemplate) =>
  previousTemplate &&
  Boolean(
    previousTemplate.properties.find(
      p => p.name === property.name && p.type === property.type && p.content === property.content
    )
  );

const defaultValueByType = (type, options) => {
  switch (type) {
    case 'daterange':
      return { from: null, to: null };
    case 'generatedid':
      return !options.resetExisting ? generateID(3, 4, 4) : undefined;
    case 'multiselect':
    case 'relationship':
    case 'newRelationship':
    case 'nested':
    case 'multidate':
    case 'multidaterange':
      return [];
    default:
      if (!['date', 'geolocation', 'link'].includes(type)) {
        return '';
      }
      return undefined;
  }
};

const resetMetadata = (metadata, template, options, previousTemplate) => {
  const resetedMetadata = {};
  template.properties.forEach(property => {
    const resetValue =
      options.resetExisting ||
      !propertyExists(property, previousTemplate) ||
      !metadata[property.name];

    const { type, name } = property;
    if (!resetValue) {
      resetedMetadata[property.name] = metadata[property.name];
    }
    if (resetValue) {
      const defaultValue = defaultValueByType(type, options);
      if (defaultValue !== undefined) resetedMetadata[name] = defaultValue;
    }
  });
  return resetedMetadata;
};

const getPropertyValue = (property, metadataProperty) => {
  switch (property.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'nested':
    case 'relationship':
    case 'newRelationship':
    case 'multidate':
    case 'geolocation':
      return metadataProperty.map(v => v.value);
    case 'generatedid':
      return typeof metadataProperty === 'string' ? metadataProperty : metadataProperty[0].value;
    default:
      return metadataProperty[0].value;
  }
};

const UnwrapMetadataObject = (MetadataObject, Template) =>
  Object.keys(MetadataObject).reduce((UnwrapedMO, key) => {
    if (!MetadataObject[key].length) {
      return UnwrapedMO;
    }
    const property = Template.properties.find(p => p.name === key);
    const propertyValue = getPropertyValue(property, MetadataObject[key]);
    return { ...UnwrapedMO, [key]: propertyValue };
  }, {});

function checkGeneratedTitle(entity, template) {
  const generatedTitle =
    !entity.title &&
    template.commonProperties.find(property => property.name === 'title' && property.generatedId);
  if (generatedTitle) {
    return generateID(3, 4, 4);
  }
  return entity.title;
}

export function loadFetchedInReduxForm(form, entity, templates) {
  const sortedTemplates = advancedSort(templates, { property: 'name' });
  const defaultTemplate =
    sortedTemplates.find(sortedTemplate => sortedTemplate.default) || sortedTemplates[0];
  const templateId = entity.template || defaultTemplate._id;
  const template =
    sortedTemplates.find(sortedTemplate => sortedTemplate._id === templateId) || emptyTemplate;
  const title = checkGeneratedTitle(entity, template);

  const entitySelectedOptions = {};
  template.properties.forEach(property => {
    if (property.type === 'relationship' || property.type === 'newRelationship') {
      entitySelectedOptions[property.name] = entity.metadata ? entity.metadata[property.name] : [];
    }
  });

  const metadata = UnwrapMetadataObject(
    resetMetadata({ ...entity.metadata }, template, { resetExisting: false }, template),
    template
  );

  // suggestedMetadata remains in metadata-object form (all components consuming it are new).
  return [
    formActions.reset(form),
    formActions.load(form, { ...entity, metadata, template: templateId, title }),
    formActions.setPristine(form),
    actions.set('entityThesauris', entitySelectedOptions),
  ];
}

export function loadInReduxForm(form, _entity, templates) {
  return dispatch => {
    (_entity.sharedId
      ? api.get(new RequestParams({ sharedId: _entity.sharedId }))
      : Promise.resolve([_entity])
    ).then(([response]) => {
      const { attachments } = response;
      const sortedAttachments = attachments
        ? advancedSort(attachments, { property: 'originalname' })
        : attachments;
      const entity = { ...response, attachments: sortedAttachments };
      loadFetchedInReduxForm(form, entity, templates).forEach(action => dispatch(action));
      dispatch(reloadThesauri());
    });
  };
}

export function changeTemplate(form, templateId) {
  return (dispatch, getState) => {
    const entity = { ...getModel(getState(), form) };
    const { templates } = getState();
    const template = templates.find(temp => temp.get('_id') === templateId);
    const previousTemplate = templates.find(temp => temp.get('_id') === entity.template);

    const templateJS = template.toJS();
    const title = checkGeneratedTitle(entity, templateJS);

    entity.metadata = resetMetadata(
      entity.metadata,
      templateJS,
      { resetExisting: false },
      previousTemplate.toJS()
    );
    entity.template = template.get('_id');

    dispatch(formActions.reset(form));
    setTimeout(() => {
      dispatch(formActions.load(form, { ...entity, title }));
    });
  };
}

export function loadTemplate(form, template) {
  return dispatch => {
    const entity = { template: template._id, metadata: {} };
    entity.metadata = resetMetadata(entity.metadata, template, { resetExisting: true });
    dispatch(formActions.load(form, entity));
    dispatch(formActions.setPristine(form));
  };
}

export function removeIcon(model) {
  return formActions.change(model, { _id: null, type: 'Empty' });
}

export function multipleUpdate(entities, values) {
  return async dispatch => {
    const ids = entities.map(e => e.get('sharedId')).toJS();
    const updatedEntities = await api.multipleUpdate(new RequestParams({ ids, values }));
    dispatch(notificationActions.notify(t('System', 'Update success', null, false), 'success'));
    if (values.published !== undefined) {
      await dispatch(unselectAllDocuments());
      dispatch(removeDocuments(updatedEntities));
    }
    return updatedEntities;
  };
}

export async function getSuggestions(templates, searchTerm = '') {
  const request = new RequestParams({ searchTerm, templates });
  return searchAPI.getSuggestions(request);
}

export const clearMetadataSelections = () =>
  actions.unset('documentViewer.metadataExtraction', ['selections']);

export { resetReduxForm, resetMetadata, UnwrapMetadataObject };
