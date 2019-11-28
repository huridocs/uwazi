/** @format */

import RouteHandler from 'app/App/RouteHandler';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import PDFView from './PDFView';
import EntityView from './EntityView';
import ViewerComponent from './components/ViewerComponent';
import React from 'react';

class ViewerRoute extends RouteHandler {
  static async requestState(requestParams, globalResources) {
    const { sharedId } = requestParams.data;
    const [entity] = await EntitiesAPI.get(requestParams.set({ sharedId }));

    return entity.file
      ? PDFView.requestState(requestParams, globalResources)
      : EntityView.requestState(requestParams, globalResources);
  }

  render() {
    return <ViewerComponent {...this.props} />;
  }
}

ViewerRoute.defaultProps = {
  params: {},
};

export default ViewerRoute;
