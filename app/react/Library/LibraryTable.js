import RouteHandler from 'app/App/RouteHandler';
import React from 'react';
import { TableViewer } from 'app/Layout/TableViewer';
import Library from 'app/Library/Library';
import { requestState } from 'app/Library/helpers/requestState';

/* TODO: This class is a temporal approach to be removed when we can
   make Library and LibraryTable subclasses of the same base class. */
class LibraryOverrideRequestState extends Library {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { calculateTableColumns: true });
  }
}

export class LibraryTable extends RouteHandler {
  render() {
    return (
      <LibraryOverrideRequestState
        viewer={TableViewer}
        location={this.props.location}
        sidePanelMode="unpinned-mode"
        noScrollable
      />
    );
  }
}
