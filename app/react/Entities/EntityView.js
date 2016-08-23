import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';

export default class Entity extends RouteHandler {

  static requestState({entityId}) {
    return Promise.all([entitiesAPI.get(entityId), templatesAPI.get(), thesaurisAPI.get(), referencesAPI.get(entityId)])
    .then(([entities, templates, thesauris, references]) => {
      return {
        entityView: {entity: entities[0], references},
        templates,
        thesauris
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/references', state.entityView.references));
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
  }

  render() {
    return <EntityViewer/>;
  }
}
