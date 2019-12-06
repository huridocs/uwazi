/** @format */

import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriCockpit from 'app/Thesauris/components/ThesauriCockpit';
//import { editThesauri } from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class ClassifierCockpit extends RouteHandler {
  static async requestState(requestParams: any) {
    const thesauris = await api.get(requestParams);

    //return [editThesauri(thesauris[0])];
  }

  render() {
    return <ThesauriCockpit />;
  }
}
