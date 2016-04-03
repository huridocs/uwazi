import React from 'react';

import RouteHandler from '~/controllers/App/RouteHandler';
import ThesauriForm from '~/Thesauris/components/ThesauriForm';
import '~/Thesauris/scss/thesauris.scss';

export default class NewThesauri extends RouteHandler {

  render() {
    return <ThesauriForm />;
  }
}

//when all components are integrated with redux we can remove this
NewThesauri.__redux = true;
