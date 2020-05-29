import { actions as formActions, getModel } from 'react-redux-form';

import { advancedSort } from 'app/utils/advancedSort';
import { api } from 'app/Entities';
import { notificationActions } from 'app/Notifications';
import { removeDocuments, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { RequestParams } from 'app/utils/RequestParams';
import emptyTemplate from '../helpers/defaultTemplate';
import searchAPI from 'app/Search/SearchAPI';
import { actions } from 'app/BasicReducer';

export function resetReduxForm(form) {
  return formActions.reset(form);
}

const propertyExists = (property, previousTemplate) =>
  previousTemplate &&
  Boolean(
    previousTemplate.properties.find(
      p => p.name === property.name && p.type === property.type && p.content === property.content
    )
  );

export const resetMetadata = (metadata, template, options, previousTemplate) => {
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
    if (resetValue && !['date', 'geolocation', 'link'].includes(type)) {
      resetedMetadata[name] = '';
    }
    if (resetValue && type === 'daterange') {
      resetedMetadata[name] = { from: null, to: null };
    }
    if (
      resetValue &&
      ['multiselect', 'relationship', 'nested', 'multidate', 'multidaterange'].includes(type)
    ) {
      resetedMetadata[name] = [];
    }
  });
  return resetedMetadata;
};

export const UnwrapMetadataObject = (MetadataObject, Template) =>
  Object.keys(MetadataObject).reduce((UnwrapedMO, key) => {
    if (!MetadataObject[key].length) {
      return UnwrapedMO;
    }

    const property = Template.properties.find(p => p.name === key);

    const isMultiProperty = [
      'multiselect',
      'multidaterange',
      'nested',
      'relationship',
      'multidate',
      'geolocation',
    ].includes(property.type);

    return {
      ...UnwrapedMO,
      [key]: isMultiProperty ? MetadataObject[key].map(v => v.value) : MetadataObject[key][0].value,
    };
  }, {});

export function loadFetchedInReduxForm(form, entity, templates) {
  const sortedTemplates = advancedSort(templates, { property: 'name' });
  const defaultTemplate = sortedTemplates.find(t => t.default);
  const templateId = entity.template || defaultTemplate._id;
  const template = sortedTemplates.find(t => t._id === templateId) || emptyTemplate;

  const entitySelectedOptions = {};
  template.properties.forEach(property => {
    if (property.type === 'relationship') {
      entitySelectedOptions[property.name] = entity.metadata ? entity.metadata[property.name] : [];
    }
  });

  const metadata = UnwrapMetadataObject(
    resetMetadata(Object.assign({}, entity.metadata), template, { resetExisting: false }, template),
    template
  );

  // suggestedMetadata remains in metadata-object form (all components consuming it are new).
  return [
    formActions.reset(form),
    formActions.load(form, { ...entity, metadata, template: templateId }),
    formActions.setPristine(form),
    actions.set('entityThesauris', entitySelectedOptions),
  ];
}

export function loadInReduxForm(form, _entity, templates) {
  return dispatch => {
    (_entity.sharedId
      ? api.get(new RequestParams({ sharedId: _entity.sharedId }))
      : Promise.resolve([_entity])
    ).then(([entity]) => {
      loadFetchedInReduxForm(form, entity, templates).forEach(action => dispatch(action));
    });
  };
}

export function changeTemplate(form, templateId) {
  return (dispatch, getState) => {
    const entity = Object.assign({}, getModel(getState(), form));
    const { templates } = getState();
    const template = templates.find(t => t.get('_id') === templateId);
    const previousTemplate = templates.find(t => t.get('_id') === entity.template);

    entity.metadata = resetMetadata(
      entity.metadata,
      template.toJS(),
      { resetExisting: false },
      previousTemplate.toJS()
    );
    entity.template = template.get('_id');

    dispatch(formActions.reset(form));
    setTimeout(() => {
      dispatch(formActions.load(form, entity));
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
    dispatch(notificationActions.notify('Update success', 'success'));
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
