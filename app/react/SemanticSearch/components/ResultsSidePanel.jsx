import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from '#app/SemanticSearch/components/ResultsFiltersPanel.jsx';
import DocumentResultsPanel from '#app/SemanticSearch/components/DocumentResultsPanel.js';

export const ResultsSidePanel = () => (
  <>
    <ResultsFiltersPanel storeKey="library" />
    <DocumentResultsPanel />
  </>
);

export default connect()(ResultsSidePanel);
