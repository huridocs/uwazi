import React from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityProvider } from './EntityContext.js';
import { RelationshipsProvider } from './RelationshipsContext.js';
import { RelationshipsSelectionProvider } from './RelationshipsSelectionContext.js';
import { RelationshipsPanelFiltersProvider } from './RelationshipsPanelFiltersContext.js';
import { DocumentInteractionProvider } from './DocumentInteractionContext.js';
import { TocProvider } from './TocContext.js';
import { MetadataEditingProvider } from './MetadataEditingContext.js';
import { EntityOverlayProvider } from './EntityOverlayContext.js';

type EntityScopedProviderProps = {
  entity: Entity;
  children: React.ReactNode;
};

const EntityScopedProvider = ({ entity, children }: EntityScopedProviderProps) => (
  <EntityProvider entity={entity}>
    <RelationshipsProvider>
      <RelationshipsSelectionProvider>
        <RelationshipsPanelFiltersProvider>
          <DocumentInteractionProvider>
            <TocProvider>
              <MetadataEditingProvider>
                <EntityOverlayProvider>{children}</EntityOverlayProvider>
              </MetadataEditingProvider>
            </TocProvider>
          </DocumentInteractionProvider>
        </RelationshipsPanelFiltersProvider>
      </RelationshipsSelectionProvider>
    </RelationshipsProvider>
  </EntityProvider>
);

export { EntityScopedProvider };
