import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { SearchView } from './SearchView.js';
import { useDocumentInteraction } from './EntityScopedProvider.js';

const SearchResults = () => {
  const { setSearchHintsModalOpen } = useDocumentInteraction();

  return (
    <Panel>
      <Panel.Body>
        <SearchView />
      </Panel.Body>
      <Panel.Footer>
        <button type="button" onClick={() => setSearchHintsModalOpen(true)}>
          <Translate className="font-bold text-ink-secondary underline">Search Tips</Translate>
        </button>
      </Panel.Footer>
    </Panel>
  );
};

export { SearchResults };
