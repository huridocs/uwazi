import RouteHandler from 'app/App/RouteHandler';
import React from 'react';
import { TableViewer } from 'app/Layout/TableViewer';
import Library from 'app/Library/Library';
import requestState from 'app/Library/helpers/requestState';

export class LibraryTable extends RouteHandler {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, true);
  }

  render() {
    return <Library viewer={TableViewer} location={this.props.location} fixedSidePanels />;
  }
}
