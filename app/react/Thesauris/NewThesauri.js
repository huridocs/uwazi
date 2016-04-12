import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import ThesauriForm from 'app/Thesauris/components/ThesauriForm';

export default class NewThesauri extends RouteHandler {

  render() {
    return <ThesauriForm />;
  }
}

//when all components are integrated with redux we can remove this
NewThesauri.__redux = true;
