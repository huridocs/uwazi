/** @format */

import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';
import { editThesaurus } from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class EditThesauri extends RouteHandler {
  static async requestState(requestParams) {
    const thesauris = await api.get(requestParams);

    return [editThesaurus(thesauris[0])];
  }

  render() {
    return <ThesauriForm />;
  }
}
