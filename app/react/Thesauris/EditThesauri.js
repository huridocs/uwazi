import React from 'react';
import Immutable from 'immutable';

import RouteHandler from '~/controllers/App/RouteHandler';
import ThesauriForm from '~/Thesauris/components/ThesauriForm';
import {editThesauri} from '~/Thesauris/actions/thesaurisActions';
import api from '~/Thesauris/ThesaurisAPI';
import '~/Thesauris/scss/thesauris.scss';

export default class EditThesauri extends RouteHandler {

  static requestState({thesauriId}) {
    return api.get(thesauriId)
    .then((thesauris) => {
      return {thesauri: Immutable.fromJS(thesauris[0])};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(editThesauri(state.thesauri));
  }

  render() {
    return <ThesauriForm />;
  }
}

//when all components are integrated with redux we can remove this
EditThesauri.__redux = true;
