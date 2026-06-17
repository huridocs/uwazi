import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { useSearchHints } from '#V2/Routes/Entity/Components/context/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const SearchTabFooter = () => {
  const { setSearchHintsModalOpen } = useSearchHints();

  return (
    <EntityTabFooter>
      <button type="button" onClick={() => setSearchHintsModalOpen(true)}>
        <Translate className="font-bold text-ink-secondary underline">Search Tips</Translate>
      </button>
    </EntityTabFooter>
  );
};

export { SearchTabFooter };
