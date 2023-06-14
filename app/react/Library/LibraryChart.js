import React from 'react';
import { ChartViewer } from 'app/Layout/ChartViewer';
import Library from 'app/Library/Library';
import LibraryLayout from 'app/Library/LibraryLayout';
import DocumentsList from 'app/Library/components/DocumentsList';
import { requestState } from 'app/Library/helpers/requestState';
import { withRouter } from 'app/componentWrappers';
import { trackPage } from 'app/App/GoogleAnalytics';

class LibraryChartComponent extends Library {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { calculateTableColumns: true });
  }

  render() {
    trackPage();
    return (
      <LibraryLayout className="chart-library">
        <DocumentsList storeKey="library" CollectionViewer={ChartViewer} />
      </LibraryLayout>
    );
  }
}

const SSRLibraryComponent = withRouter(LibraryChartComponent);

const LibraryChart = Object.assign(SSRLibraryComponent, {
  requestState: LibraryChartComponent.requestState,
});

export { LibraryChartComponent };
export { LibraryChart };
