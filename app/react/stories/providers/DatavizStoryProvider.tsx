import React from 'react';
import { MemoryRouter } from 'react-router';
import { useHydrateAtoms } from 'jotai/utils';
import { relationshipTypesAtom, templatesAtom, thesauriAtom } from '#V2/atoms/index.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import { DatavizApiProvider } from '#V2/Dataviz/api/DatavizApiContext.js';
import type { DatavizApi, DatavizApiOptions } from '#V2/Dataviz/api/contracts.js';
import {
  datavizRelationTypes,
  datavizTemplates,
  datavizThesauri,
} from '../fixtures/datavizFixtures.js';

type DatavizAtomHydrationProps = {
  children: React.ReactNode;
};

/** Hydrates dataviz fixtures into the Storybook global Jotai store (theme stays on parent). */
const DatavizAtomHydration = ({ children }: DatavizAtomHydrationProps) => {
  useHydrateAtoms([
    [templatesAtom, datavizTemplates],
    [thesauriAtom, datavizThesauri],
    [relationshipTypesAtom, datavizRelationTypes],
  ]);
  return children;
};

type DatavizStoryProviderProps = {
  children: React.ReactNode;
  api?: DatavizApi;
  apiOptions?: DatavizApiOptions;
};

const DatavizStoryProvider = ({ children, api, apiOptions }: DatavizStoryProviderProps) => (
  <MemoryRouter>
    <DatavizAtomHydration>
      <ThemeProvider>
        <DatavizApiProvider api={api} options={apiOptions}>
          <div className="h-screen">{children}</div>
        </DatavizApiProvider>
      </ThemeProvider>
    </DatavizAtomHydration>
  </MemoryRouter>
);

export { DatavizStoryProvider };
