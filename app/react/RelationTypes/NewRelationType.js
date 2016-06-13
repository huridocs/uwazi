import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import RelationTypeForm from 'app/RelationTypes/components/RelationTypeForm';

export default class NewRelationType extends RouteHandler {

  render() {
    return <RelationTypeForm />;
  }
}
