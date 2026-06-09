import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { searchHintsModalAtom } from './atoms.js';
import { SearchView } from './SearchView.js';

const SearchResults = () => {
  const openHints = useSetAtom(searchHintsModalAtom);

  return (
    <Panel>
      <Panel.Body>
        <SearchView />
      </Panel.Body>
      <Panel.Footer>
        <button type="button" onClick={() => openHints(true)}>
          <Translate className="font-bold text-ink-secondary underline">Search Tips</Translate>
        </button>
      </Panel.Footer>
    </Panel>
  );
};

export { SearchResults };
