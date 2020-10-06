import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from './ResultsFiltersPanel';
import DocumentResultsPanel from './DocumentResultsPanel';

export function ResultsSidePanel() {
  return (
    <>
      <ResultsFiltersPanel storeKey="library" />
      <DocumentResultsPanel />
    </>
  );
}

export default connect()(ResultsSidePanel);
