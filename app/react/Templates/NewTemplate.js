import React, {PropTypes} from 'react';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {setThesauris} from 'app/Thesauris/actions/thesaurisActions';
import {setTemplates} from 'app/Templates/actions/templatesActions';
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
    this.context.store.dispatch(setThesauris(thesauris));
    this.context.store.dispatch(setTemplates(templates));
  }

  render() {
    return <TemplateCreator />;
  }

}

NewTemplate.contextTypes = {
  store: PropTypes.object.isRequired
};
