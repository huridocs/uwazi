import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import { editThesauri } from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class EditThesauri extends RouteHandler {
  static async requestState(requestParams) {
    const thesauris = await api.get(requestParams);

    return [
      editThesauri(thesauris[0])
    ];
  }

  render() {
    return <ThesauriForm />;
  }
}
