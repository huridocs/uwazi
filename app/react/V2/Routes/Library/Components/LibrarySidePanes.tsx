import React from 'react';
import { t } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import type { PaneProps } from '#V2/Components/Layouts/PaneLayout/types.js';
import { LibraryFilters } from './LibraryFilters.js';
import { LibraryRightPane, type LibraryRightPaneProps } from './LibraryRightPane.js';

type LibrarySidePanesProps = LibraryRightPaneProps & {
  isMobile: boolean;
  filtersOpen: boolean;
  onFiltersDismiss: () => void;
  requestPane: (index: number) => void;
};

const filtersList = ({
  aggregations,
  filters,
  andFilters,
  chips,
  onFiltersChange,
  onAndFiltersChange,
}: LibraryRightPaneProps) => (
  <LibraryFilters
    aggregations={aggregations}
    filters={filters}
    andFilters={andFilters}
    onChange={onFiltersChange}
    onAndFiltersChange={onAndFiltersChange}
    chips={chips}
  />
);

const libraryRightPaneElement = (pane: LibraryRightPaneProps, onClosePreview: () => void) => (
  <LibraryRightPane
    creating={pane.creating}
    rows={pane.rows}
    selectedIds={pane.selectedIds}
    selectionPanelOpen={pane.selectionPanelOpen}
    entityBasePath={pane.entityBasePath}
    focusFieldKey={pane.focusFieldKey}
    aggregations={pane.aggregations}
    filters={pane.filters}
    andFilters={pane.andFilters}
    chips={pane.chips}
    onFiltersChange={pane.onFiltersChange}
    onAndFiltersChange={pane.onAndFiltersChange}
    onClosePreview={onClosePreview}
    onCloseSelection={pane.onCloseSelection}
    onRemoveSelection={pane.onRemoveSelection}
    onPreviewSelection={pane.onPreviewSelection}
    onCreated={pane.onCreated}
    onAction={pane.onAction}
  />
);

const librarySidePanes = ({
  isMobile,
  filtersOpen,
  onFiltersDismiss,
  requestPane,
  ...pane
}: LibrarySidePanesProps): React.ReactElement<PaneProps>[] => {
  if (!isMobile) {
    return [
      <PaneLayout.Pane key="side" background="transparent">
        {libraryRightPaneElement(pane, pane.onClosePreview)}
      </PaneLayout.Pane>,
    ];
  }

  const popPreview = () => {
    pane.onClosePreview();
    requestPane(filtersOpen ? 1 : 0);
  };
  const panes: React.ReactElement<PaneProps>[] = [];
  if (filtersOpen) {
    panes.push(
      <PaneLayout.Pane
        key="filters"
        background="transparent"
        mobileSnap="half"
        mobileTitle={t('System', 'Filters', null, false)}
        onMobileClose={onFiltersDismiss}
      >
        {filtersList(pane)}
      </PaneLayout.Pane>
    );
  }
  if (pane.creating || pane.selectedIds.length > 0) {
    panes.push(
      <PaneLayout.Pane
        key="preview"
        background="transparent"
        mobileSnap={pane.creating ? 'full' : 'half'}
        onMobileClose={pane.onClosePreview}
      >
        {libraryRightPaneElement(pane, popPreview)}
      </PaneLayout.Pane>
    );
  }
  return panes;
};

export { librarySidePanes };
