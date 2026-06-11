import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { searchHintsModalAtom } from '../../Components/atoms.js';
import { EntityTabFooter } from '../EntityTabFooter.js';

const SearchTabFooter = () => {
  const openHints = useSetAtom(searchHintsModalAtom);

  return (
    <EntityTabFooter>
      <button type="button" onClick={() => openHints(true)}>
        <Translate className="font-bold text-ink-secondary underline">Search Tips</Translate>
      </button>
    </EntityTabFooter>
  );
};

export { SearchTabFooter };
