import React, { useState } from 'react';
import { PaneLayout } from '#V2/Components/Layouts/PaneLayout.js';
import { librarySidePanes } from '../LibrarySidePanes.js';

const aggregations = { templates: [], published: { published: 0, restricted: 0 }, properties: {} };
const noop = () => undefined;

const requestedIndexes: number[] = [];

const SwipeProbe = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [requestedPane, setRequestedPane] = useState<{ index: number; id: number }>();
  const requestPane = (index: number) => {
    requestedIndexes.push(index);
    setRequestedPane(current => ({ index, id: (current?.id ?? 0) + 1 }));
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelectedIds(['entity-1']);
          requestPane(1);
        }}
      >
        open preview
      </button>
      <button type="button" onClick={() => setSelectedIds(['entity-1'])}>
        select without request
      </button>
      <PaneLayout requestedPane={requestedPane}>
        <PaneLayout.Pane>library</PaneLayout.Pane>
        {librarySidePanes({
          isMobile: true,
          filtersOpen: false,
          resultsOpen: false,
          onFiltersDismiss: noop,
          onResultsDismiss: noop,
          requestPane,
          creating: false,
          rows: [],
          selectedIds,
          selectionPanelOpen: false,
          entityBasePath: '/en/library',
          aggregations,
          filters: { type: ['kept'] },
          andFilters: [],
          chips: [],
          onFiltersChange: noop,
          onAndFiltersChange: noop,
          onClosePreview: afterClose => {
            setSelectedIds([]);
            afterClose?.();
          },
          onCloseSelection: noop,
          onRemoveSelection: noop,
          onPreviewSelection: noop,
          onCreated: noop,
          search: '',
          paneTab: 'filters',
          onPaneTabChange: noop,
          onFocusProperty: noop,
          onSelectResult: noop,
          onClearSearch: noop,
        })}
      </PaneLayout>
    </>
  );
};

export { requestedIndexes, SwipeProbe };
