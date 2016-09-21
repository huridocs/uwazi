import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import entitiesAPI from './EntitiesAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {actions} from 'app/BasicReducer';
import EntityViewer from './components/EntityViewer';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';

export default class Entity extends RouteHandler {

  static requestState({entityId}) {
    return Promise.all([
      entitiesAPI.get(entityId),
      templatesAPI.get(),
      thesaurisAPI.get(),
      referencesAPI.get(entityId),
      relationTypesAPI.get()])
    .then(([entities, templates, thesauris, references, relationTypes]) => {
      return {
        entityView: {entity: entities[0], references},
        templates,
        thesauris,
        relationTypes
      };
    });
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('entityView/entity'));
    this.context.store.dispatch(actions.unset('entityView/references'));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
    this.context.store.dispatch(actions.set('entityView/entity', state.entityView.entity));
    this.context.store.dispatch(actions.set('entityView/references', state.entityView.references));
  }

  render() {
    return <EntityViewer/>;
  }
}
