import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from './ResultsFiltersPanel';
import DocumentResultsPanel from './DocumentResultsPanel';

export function ResultsSidePanel() {
  return (
    <React.Fragment>
      <ResultsFiltersPanel storeKey="library" />
      <DocumentResultsPanel />
    </React.Fragment>
  );
}

export default connect()(ResultsSidePanel);
