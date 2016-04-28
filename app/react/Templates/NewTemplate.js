import React, {PropTypes} from 'react';
import Immutable from 'immutable';

import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {setThesauris} from 'app/Templates/actions/uiActions';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/controllers/App/RouteHandler';

export default class NewTemplate extends RouteHandler {

  static requestState() {
    return Promise.all([
      thesaurisAPI.get(),
      templatesAPI.get()
    ])
    .then(([thesauris, templates]) => {
      return {
        template: {
          uiState: Immutable.fromJS({thesauris, templates})
        }
      };
    });
  }

  setReduxState({template}) {
    this.context.store.dispatch(setThesauris(template.uiState.toJS().thesauris));
  }

  render() {
    return <TemplateCreator />;
  }

}

NewTemplate.contextTypes = {
  store: PropTypes.object.isRequired
};

//when all components are integrated with redux we can remove this
NewTemplate.__redux = true;
