import React from 'react';

import RouteHandler from 'app/controllers/App/RouteHandler';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';

export default class NewRelationType extends RouteHandler {

  render() {
    return <RelationTypeForm />;
  }
}

//when all components are integrated with redux we can remove this
NewRelationType.__redux = true;
