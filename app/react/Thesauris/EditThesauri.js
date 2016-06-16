import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import {editThesauri} from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class EditThesauri extends RouteHandler {

  static requestState({thesauriId}) {
    return api.get(thesauriId)
    .then((thesauris) => {
      return {thesauri: {data: thesauris[0]}};
    });
  }

  setReduxState({thesauri}) {
    this.context.store.dispatch(editThesauri(thesauri.data));
  }

  render() {
    return <ThesauriForm />;
  }
}
