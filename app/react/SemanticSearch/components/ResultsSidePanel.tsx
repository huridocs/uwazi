import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from '#app/ResultsFiltersPanel';
import DocumentResultsPanel from '#app/DocumentResultsPanel';

export const ResultsSidePanel = () => (
  <>
    <ResultsFiltersPanel storeKey="library" />
    <DocumentResultsPanel />
  </>
);

export default connect()(ResultsSidePanel);
