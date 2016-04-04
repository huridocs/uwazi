import React, {PropTypes} from 'react';
import Immutable from 'immutable';

import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {setThesauri} from 'app/Templates/actions/uiActions';
import TemplateCreator from 'app/Templates/components/TemplateCreator';
import RouteHandler from 'app/controllers/App/RouteHandler';

export default class NewTemplate extends RouteHandler {

  static requestState() {
    return thesaurisAPI.get()
    .then((thesauri) => {
      return {
        template: {
          uiState: Immutable.fromJS({thesauri: thesauri})
        }
      };
    });
  }

  setReduxState({template}) {
    this.context.store.dispatch(setThesauri(template.uiState.toJS().thesauri));
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
