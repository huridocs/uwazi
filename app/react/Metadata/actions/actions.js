import superagent from 'superagent';
import {actions as formActions} from 'react-redux-form';
import {requestViewerState, setViewerState} from 'app/Viewer/actions/routeActions';
import {PDFReady} from 'app/Viewer/actions/uiActions';
import {APIURL} from 'app/config.js';
import * as types from './actionTypes';

export function resetReduxForm(form) {
  return formActions.reset(form);
}

const resetMetadata = (metadata, template, options) => {
  template.properties.forEach((property) => {
    const assignProperty = options.resetExisting || !metadata[property.name];
    if (assignProperty && property.type !== 'date') {
      metadata[property.name] = '';
    }
    if (assignProperty && property.type === 'multiselect') {
      metadata[property.name] = [];
    }
    if (assignProperty && property.type === 'nested') {
      metadata[property.name] = [];
    }
    if (assignProperty && property.type === 'multidate') {
      metadata[property.name] = [];
    }
    if (assignProperty && property.type === 'multidaterange') {
      metadata[property.name] = [];
    }
  });
};

export function loadInReduxForm(form, onlyReadEntity, templates) {
  return function (dispatch) {
    //test
    let entity = Object.assign({}, onlyReadEntity);
    //

    if (!entity.template) {
      entity.template = templates[0]._id;
      if (entity.type === 'document' && templates.find(t => !t.isEntity)) {
        entity.template = templates.find(t => !t.isEntity)._id;
      }
      if (entity.type === 'entity' && templates.find(t => t.isEntity)) {
        entity.template = templates.find(t => t.isEntity)._id;
      }
    }

    if (!entity.metadata) {
      entity.metadata = {};
    }

    let template = templates.find((t) => t._id === entity.template);
    resetMetadata(entity.metadata, template, {resetExisting: false});

    dispatch(formActions.load(form, entity));
    dispatch(formActions.setInitial(form));
  };
}

export function changeTemplate(form, onlyReadEntity, template) {
  return function (dispatch) {
    //test
    let entity = Object.assign({}, onlyReadEntity);
    //

    entity.metadata = {};
    resetMetadata(entity.metadata, template, {resetExisting: true});
    entity.template = template._id;

    dispatch(formActions.reset(form));
    setTimeout(() => {
      dispatch(formActions.load(form, entity));
    });
  };
}

export function reuploadDocument(docId, file, docSharedId) {
  return function (dispatch, getState) {
    dispatch({type: types.START_REUPLOAD_DOCUMENT, doc: docId});
    superagent.post(APIURL + 'reupload')
    .set('Accept', 'application/json')
    .field('document', docId)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      dispatch({type: types.REUPLOAD_PROGRESS, doc: docId, progress: Math.floor(data.percent)});
    })
    .on('response', () => {
      dispatch({type: types.REUPLOAD_COMPLETE, doc: docId});
      dispatch(PDFReady(false));

      requestViewerState(docSharedId, getState().locale)
      .then(state => {
        dispatch(setViewerState(state));
      });
    })
    .end();
  };
}
