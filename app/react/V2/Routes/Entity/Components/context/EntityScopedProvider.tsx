import React from 'react';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { EntityProvider } from './EntityContext.js';
import { EntityLanguageProvider } from './EntityLanguageContext.js';
import { RelationshipsProvider } from './RelationshipsContext.js';
import { RelationshipsSelectionProvider } from './RelationshipsSelectionContext.js';
import { RelationshipsPanelFiltersProvider } from './RelationshipsPanelFiltersContext.js';
import { DocumentInteractionProvider } from './DocumentInteractionContext.js';
import { TocProvider } from './TocContext.js';
import { MetadataEditingProvider } from './MetadataEditingContext.js';
import { EntityOverlayProvider } from './EntityOverlayContext.js';

type EntityScopedProviderProps = {
  entity: Entity;
  language: string;
  mainDocument?: FileType;
  pagePlaintext?: string;
  children: React.ReactNode;
};

const EntityScopedProvider = ({
  entity,
  language,
  mainDocument,
  pagePlaintext,
  children,
}: EntityScopedProviderProps) => (
  <EntityProvider entity={entity}>
    <EntityLanguageProvider
      loaderEntity={entity}
      initialLanguage={language}
      initialMainDocument={mainDocument}
      initialPagePlaintext={pagePlaintext}
    >
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
    </EntityLanguageProvider>
  </EntityProvider>
);

export { EntityScopedProvider };
