import React from 'react';
import { connect } from 'react-redux';
import { ResultsFiltersPanel } from './ResultsFiltersPanel.js';
import { DocumentResultsPanel } from './DocumentResultsPanel.js';

const ResultsSidePanel = () => (
  <>
    <ResultsFiltersPanel storeKey="library" />
    <DocumentResultsPanel />
  </>
);

const ResultsSidePanelConnected = connect()(ResultsSidePanel);
export { ResultsSidePanelConnected as ResultsSidePanel };
