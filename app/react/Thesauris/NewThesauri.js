import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';

export default class NewThesauri extends RouteHandler {

  render() {
    return <ThesauriForm />;
  }
}
