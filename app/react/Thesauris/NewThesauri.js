import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import {setThesauris} from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class NewThesauri extends RouteHandler {

  static requestState() {
    return api.get()
    .then((thesauris) => {
      return {thesauris: thesauris};
    });
  }

  setReduxState({thesauris}) {
    this.context.store.dispatch(setThesauris(thesauris));
  }

  render() {
    return <ThesauriForm />;
  }
}
