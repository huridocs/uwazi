import React from 'react';
import { TableViewer } from 'app/Layout/TableViewer';
import Library from 'app/Library/Library';
import LibraryLayout from 'app/Library/LibraryLayout';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import DocumentsList from 'app/Library/components/DocumentsList';
import { requestState } from 'app/Library/helpers/requestState';

export class LibraryTable extends Library {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { calculateTableColumns: true });
  }

  render() {
    return (
      <LibraryLayout sidePanelMode={this.props.sidePanelMode}>
        <LibraryModeToggleButtons
          storeKey="library"
          zoomIn={this.zoomIn}
          zoomOut={this.zoomOut}
          tableViewMode={true}
        />
        <DocumentsList storeKey="library" CollectionViewer={TableViewer} />
      </LibraryLayout>
    );
  }
}
