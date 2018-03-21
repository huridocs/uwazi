import {actions as formActions} from 'react-redux-form';
import PropTypes from 'prop-types';
import React from 'react';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import {actions} from 'app/BasicReducer';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';

export default class NewTemplate extends RouteHandler {

  static requestState() {
    return Promise.all([
      thesaurisAPI.get(),
      templatesAPI.get(),
      relationTypesAPI.get()
    ])
    .then(([thesauris, templates, relationTypes]) => {
      return {thesauris, templates, relationTypes};
    });
  }

  setReduxState({thesauris, templates, relationTypes}) {
    this.context.store.dispatch(formActions.reset('template.data'));
    this.context.store.dispatch(actions.set('thesauris', thesauris));
    this.context.store.dispatch(actions.set('templates', templates));
    this.context.store.dispatch(actions.set('relationTypes', relationTypes));
  }

  render() {
    return <TemplateCreator />;
  }

}

NewTemplate.contextTypes = {
  store: PropTypes.object.isRequired
};
