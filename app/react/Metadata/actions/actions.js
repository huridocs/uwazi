import superagent from 'superagent';
import { actions as formActions, getModel } from 'react-redux-form';
import { requestViewerState, setViewerState } from 'app/Viewer/actions/routeActions';
import { APIURL } from 'app/config.js';
import * as types from './actionTypes';
import { api as entitiesAPI } from 'app/Entities';
import { notify } from 'app/Notifications';
import { advancedSort } from 'app/utils/advancedSort';

export function resetReduxForm(form) {
  return formActions.reset(form);
}

const resetMetadata = (metadata, template, options) => {
  template.properties.forEach((property) => {
    const assignProperty = options.resetExisting || !metadata[property.name];
    const { type, name } = property;
    if (assignProperty && type !== 'date') {
      metadata[name] = '';
    }
    if (assignProperty && type === 'daterange') {
      metadata[name] = {};
    }
    if (assignProperty && ['multiselect', 'relationship', 'nested', 'multidate', 'multidaterange'].includes(type)) {
      metadata[name] = [];
    }
    if (assignProperty && type === 'geolocation') {
      metadata[name] = { lat: 0, lon: 0 };
    }
  });
};

export function loadInReduxForm(form, onlyReadEntity, templates) {
  return (dispatch) => {
    const entity = Object.assign({}, onlyReadEntity);

    const sortedTemplates = advancedSort(templates, { property: 'name' });

    if (!entity.template) {
      entity.template = sortedTemplates[0]._id;
      if (entity.type === 'document' && sortedTemplates.find(t => !t.isEntity)) {
        entity.template = sortedTemplates.find(t => !t.isEntity)._id;
      }
      if (entity.type === 'entity' && sortedTemplates.find(t => t.isEntity)) {
        entity.template = sortedTemplates.find(t => t.isEntity)._id;
      }
    }

    if (!entity.metadata) {
      entity.metadata = {};
    }

    const template = sortedTemplates.find(t => t._id === entity.template);
    resetMetadata(entity.metadata, template, { resetExisting: false });

    dispatch(formActions.reset(form));
    dispatch(formActions.load(form, entity));
    dispatch(formActions.setPristine(form));
  };
}

export function changeTemplate(form, templateId) {
  return (dispatch, getState) => {
    const entity = Object.assign({}, getModel(getState(), form));
    entity.metadata = {};

    const template = getState().templates.find(t => t.get('_id') === templateId);

    resetMetadata(entity.metadata, template.toJS(), { resetExisting: true });
    entity.template = template.get('_id');

    dispatch(formActions.reset(form));
    setTimeout(() => {
      dispatch(formActions.load(form, entity));
    });
  };
}

export function loadTemplate(form, template) {
  return (dispatch) => {
    const data = { template: template._id, metadata: {} };
    resetMetadata(data.metadata, template, { resetExisting: true });
    dispatch(formActions.load(form, data));
    dispatch(formActions.setPristine(form));
  };
}

export function reuploadDocument(docId, file, docSharedId, __reducerKey) {
  return (dispatch, getState) => {
    dispatch({ type: types.START_REUPLOAD_DOCUMENT, doc: docId });
    superagent.post(`${APIURL}reupload`)
    .set('Accept', 'application/json')
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({ type: types.REUPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent) });
    })
    .on('response', () => {
      dispatch({ type: types.REUPLOAD_COMPLETE, doc: docId, file, __reducerKey });

      requestViewerState(docSharedId, getState().locale, { templates: getState().templates })
      .then((state) => {
        dispatch(setViewerState(state));
      });
    })
    .end();
  };
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

    const updatedEntitiesIds = updatedEntities.map(entity => entity.sharedId);
    return entitiesAPI.multipleUpdate(updatedEntitiesIds, values)
    .then(() => {
      dispatch(notify('Update success', 'success'));
      return updatedEntities;
    });
  };
}
