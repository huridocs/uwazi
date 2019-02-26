import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from './ResultsFiltersPanel';
import DocumentResultsPanel from './DocumentResultsPanel';

import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';

export function ResultsSidePanel() {
  return (
    <React.Fragment>
      <ResultsFiltersPanel storeKey="library" />
      <DocumentResultsPanel />
    </React.Fragment>
  );
}

export default connect()(ResultsSidePanel);
