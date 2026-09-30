import React from 'react';
import { t } from '#app/I18N/index.js';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { LibraryFiltersState } from '../libraryUrlState.js';
import type { Chip } from './ActiveFiltersSheet.js';
import { LibraryCreateEntityPanel } from './LibraryCreateEntityPanel.js';
import { LibraryEntityPreview } from './LibraryEntityPreview.js';
import { LibraryFilters } from './LibraryFilters.js';

type LibraryRightPaneProps = {
  creating: boolean;
  selectedId?: string;
  entityBasePath: string;
  focusFieldKey?: string;
  aggregations: LibraryAggregations;
  filters: LibraryFiltersState;
  andFilters: string[];
  chips: Chip[];
  onFiltersChange: (filters: LibraryFiltersState) => void;
  onAndFiltersChange: (andFilters: string[]) => void;
  onClosePreview: () => void;
  onCreated: (sharedId?: string) => void;
};

type LibrarySidePanesProps = LibraryRightPaneProps & {
  isMobile: boolean;
  filtersOpen: boolean;
  onFiltersDismiss: () => void;
  requestPane: (index: number) => void;
};

type FiltersListProps = Pick<
  LibraryRightPaneProps,
  'aggregations' | 'filters' | 'andFilters' | 'chips' | 'onFiltersChange' | 'onAndFiltersChange'
>;

const filtersList = ({
  aggregations,
  filters,
  andFilters,
  chips,
  onFiltersChange,
  onAndFiltersChange,
}: FiltersListProps) => (
  <LibraryFilters
    aggregations={aggregations}
    filters={filters}
    andFilters={andFilters}
    onChange={onFiltersChange}
    onAndFiltersChange={onAndFiltersChange}
    chips={chips}
  />
);

const renderLibraryRightPane = ({
  creating,
  selectedId,
  entityBasePath,
  focusFieldKey,
  aggregations,
  filters,
  andFilters,
  chips,
  onFiltersChange,
  onAndFiltersChange,
  onClosePreview,
  onCreated,
}: LibraryRightPaneProps) => {
  if (creating) {
    return <LibraryCreateEntityPanel onClose={onClosePreview} onCreated={onCreated} />;
  }
  if (selectedId) {
    return (
      <LibraryEntityPreview
        key={selectedId}
        sharedId={selectedId}
        entityBasePath={entityBasePath}
        onClose={onClosePreview}
        focusFieldKey={focusFieldKey}
      />
    );
  }
  return filtersList({
    aggregations,
    filters,
    andFilters,
    chips,
    onFiltersChange,
    onAndFiltersChange,
  });
};

const librarySidePanes = ({
  isMobile,
  filtersOpen,
  onFiltersDismiss,
  requestPane,
  ...pane
}: LibrarySidePanesProps) => {
  if (!isMobile) {
    return (
      <PaneLayout.Pane key="side" background="transparent">
        {renderLibraryRightPane(pane)}
      </PaneLayout.Pane>
    );
  }

  const popPreview = () => {
    pane.onClosePreview();
    requestPane(filtersOpen ? 1 : 0);
  };
  const panes: React.ReactElement[] = [];
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
  if (pane.creating || pane.selectedId) {
    panes.push(
      <PaneLayout.Pane
        key="preview"
        background="transparent"
        mobileSnap={pane.creating ? 'full' : 'half'}
        onMobileClose={pane.onClosePreview}
      >
        {renderLibraryRightPane({ ...pane, onClosePreview: popPreview })}
      </PaneLayout.Pane>
    );
  }
  return panes;
};

export { librarySidePanes };
