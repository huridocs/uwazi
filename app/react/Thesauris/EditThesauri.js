import React from 'react';

import RouteHandler from '~/controllers/App/RouteHandler';
import ThesauriForm from '~/Thesauris/components/ThesauriForm';
import {editThesauri} from '~/Thesauris/actions/thesaurisActions';
import api from '~/Thesauris/ThesaurisAPI';
import '~/Thesauris/scss/thesauris.scss';

export default class EditThesauri extends RouteHandler {

  static requestState({thesauriId}) {
    return api.get(thesauriId)
    .then((thesauris) => {
      return thesauris[0];
    });
  }

  setReduxState(thesauri) {
    this.context.store.dispatch(editThesauri(thesauri));
  }

  render() {
    return <ThesauriForm />;
  }
}

//when all components are integrated with redux we can remove this
EditThesauri.__redux = true;
