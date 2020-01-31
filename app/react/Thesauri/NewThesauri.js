import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauri/components/ThesauriForm';
import { actions } from 'app/BasicReducer';
import api from 'app/Thesauri/ThesaurisAPI';

export default class NewThesauri extends RouteHandler {
  static async requestState(requestParams) {
    const thesauris = await api.get(requestParams);
    return [
      actions.set('thesauris', thesauris),
    ];
  }

  render() {
    return <ThesauriForm new />;
  }
}
