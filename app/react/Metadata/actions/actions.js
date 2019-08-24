import { actions as formActions, getModel } from 'react-redux-form';
import superagent from 'superagent';

import { APIURL } from 'app/config.js';
import { advancedSort } from 'app/utils/advancedSort';
import { api } from 'app/Entities';
import { notificationActions } from 'app/Notifications';
import * as libraryTypes from 'app/Library/actions/actionTypes';
import { removeDocuments, unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { RequestParams } from 'app/utils/RequestParams';
import emptyTemplate from '../helpers/defaultTemplate';

import * as types from './actionTypes';

export function resetReduxForm(form) {
  return formActions.reset(form);
}

const propertyExists = (property, previousTemplate) => previousTemplate && Boolean(previousTemplate.properties.find(p => p.name === property.name &&
      p.type === property.type &&
      p.content === property.content));

const resetMetadata = (metadata, template, options, previousTemplate) => {
  const resetedMetadata = {};
  template.properties.forEach((property) => {
    const resetValue = options.resetExisting || !propertyExists(property, previousTemplate) || !metadata[property.name];
    const { type, name } = property;
    if (!resetValue) {
      resetedMetadata[property.name] = metadata[property.name];
    }
    if (resetValue && !['date', 'geolocation', 'link'].includes(type)) {
      resetedMetadata[name] = '';
    }
    if (resetValue && type === 'daterange') {
      resetedMetadata[name] = {};
    }
    if (resetValue && ['multiselect', 'relationship', 'nested', 'multidate', 'multidaterange'].includes(type)) {
      resetedMetadata[name] = [];
    }
  });
  return resetedMetadata;
};

export function loadInReduxForm(form, _entity, templates) {
  return (dispatch) => {
    (_entity.sharedId ? api.get(new RequestParams({ sharedId: _entity.sharedId })) : Promise.resolve([_entity]))
    .then(([entity]) => {
      const sortedTemplates = advancedSort(templates, { property: 'name' });
      const defaultTemplate = sortedTemplates.find(t => t.default);
      const template = entity.template || defaultTemplate._id;
      const templateconfig = sortedTemplates.find(t => t._id === template) || emptyTemplate;
      const metadata = resetMetadata(entity.metadata || {}, templateconfig, { resetExisting: false }, templateconfig);
      dispatch(formActions.reset(form));
      dispatch(formActions.load(form, { ...entity, metadata, template }));
      dispatch(formActions.setPristine(form));
    });
  };
}

export function changeTemplate(form, templateId) {
  return (dispatch, getState) => {
    const entity = Object.assign({}, getModel(getState(), form));
    const { templates } = getState();
    const template = templates.find(t => t.get('_id') === templateId);
    const previousTemplate = templates.find(t => t.get('_id') === entity.template);

    entity.metadata = resetMetadata(entity.metadata, template.toJS(), { resetExisting: false }, previousTemplate.toJS());
    entity.template = template.get('_id');

    dispatch(formActions.reset(form));
    setTimeout(() => {
      dispatch(formActions.load(form, entity));
    });
  };
}

export function loadTemplate(form, template) {
  return (dispatch) => {
    const entity = { template: template._id, metadata: {} };
    entity.metadata = resetMetadata(entity.metadata, template, { resetExisting: true });
    dispatch(formActions.load(form, entity));
    dispatch(formActions.setPristine(form));
  };
}

export function reuploadDocument(docId, file, docSharedId, __reducerKey) {
  return (dispatch) => {
    dispatch({ type: types.START_REUPLOAD_DOCUMENT, doc: docId });
    superagent.post(`${APIURL}reupload`)
    .set('Accept', 'application/json')
    .set('X-Requested-With', 'XMLHttpRequest')
    .field('document', docSharedId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({ type: types.REUPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    })
    .on('response', ({ body }) => {
      const _file = { filename: body.filename, size: body.size, originalname: body.originalname };
      dispatch({ type: types.REUPLOAD_COMPLETE, doc: docId, file: _file, __reducerKey });
      api.get(new RequestParams({ docSharedId }))
      .then(([doc]) => {
        dispatch({ type: libraryTypes.UPDATE_DOCUMENT, doc, __reducerKey });
        dispatch({ type: libraryTypes.UNSELECT_ALL_DOCUMENTS, __reducerKey });
        dispatch({ type: libraryTypes.SELECT_DOCUMENT, doc, __reducerKey });
      });
    })
    .end();
  };
}

export function removeIcon(model) {
  return formActions.change(model, { _id: null, type: 'Empty' });
}

export function multipleUpdate(_entities, values) {
  return (dispatch) => {
    const updatedEntities = _entities.toJS().map((entity) => {
      entity.metadata = Object.assign({}, entity.metadata, values.metadata);
      if (values.icon) {
        entity.icon = values.icon;
      }
      if (values.template) {
        entity.template = values.template;
      }
      return entity;
    });

    const ids = updatedEntities.map(entity => entity.sharedId);
    return api.multipleUpdate(new RequestParams({ ids, values }))
    .then(() => {
      dispatch(notificationActions.notify('Update success', 'success'));
      if (values.published !== undefined) {
        dispatch(unselectAllDocuments());
        dispatch(removeDocuments(updatedEntities));
      }
      return updatedEntities;
    });
  };
}
