import React from 'react';
import { connect } from 'react-redux';
import ResultsFiltersPanel from './ResultsFiltersPanel.js';
import DocumentResultsPanel from './DocumentResultsPanel.js';

export const ResultsSidePanel = () => (
  <>
    <ResultsFiltersPanel storeKey="library" />
    <DocumentResultsPanel />
  </>
);

export default connect()(ResultsSidePanel);
