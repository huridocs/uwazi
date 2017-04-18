import PropTypes from 'prop-types';
import React from 'react';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {actions} from 'app/BasicReducer';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/App/RouteHandler';

export default class NewTemplate extends RouteHandler {

  static requestState() {
    return Promise.all([
      thesaurisAPI.get(),
      templatesAPI.get()
    ])
    .then(([thesauris, templates]) => {
      return {thesauris, templates};
    });
  }

  setReduxState({thesauris, templates}) {
    this.context.store.dispatch(actions.set('thesauris', thesauris));
    this.context.store.dispatch(actions.set('templates', templates));
  }

  render() {
    return <TemplateCreator />;
  }

}

NewTemplate.contextTypes = {
  store: PropTypes.object.isRequired
};
