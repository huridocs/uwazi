/** @format */

import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesaurusCockpit from 'app/Thesauris/components/ThesaurusCockpit';
import { editThesaurus } from 'app/Thesauris/actions/thesaurisActions';
import api from 'app/Thesauris/ThesaurisAPI';

export default class ClassifierCockpit extends RouteHandler {
  static async requestState(requestParams: any) {
    //const thesauris = await api.get(requestParams);
    //return [editThesaurus(thesauris[0])];
  }

  render() {
    return <ThesaurusCockpit />;
  }
}
