import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import {actions} from 'app/BasicReducer';
import api from 'app/Thesauris/ThesaurisAPI';

export default class NewThesauri extends RouteHandler {

  static requestState() {
    return api.get()
    .then((thesauris) => {
      return {thesauris: thesauris};
    });
  }

  setReduxState({thesauris}) {
    this.context.store.dispatch(actions.set('thesauris', thesauris));
  }

  render() {
    return <ThesauriForm new={true} />;
  }
}
