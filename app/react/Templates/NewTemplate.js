import React from 'react';

import TemplateCreator from '~/Templates/components/TemplateCreator';
import RouteHandler from '~/controllers/App/RouteHandler';

export default class NewTemplate extends RouteHandler {

  render() {
    return <TemplateCreator />;
  }

}

//when all components are integrated with redux we can remove this
NewTemplate.__redux = true;
