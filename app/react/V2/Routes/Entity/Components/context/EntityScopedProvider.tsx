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
import { EntityPageViewProvider, type EntityPageViewData } from '../EntityPageView/index.js';

type EntityScopedProviderProps = {
  entity: Entity;
  language: string;
  mainDocument?: FileType;
  pagePlaintext?: string;
  entityPageView?: EntityPageViewData;
  children: React.ReactNode;
};

const EntityScopedProvider = ({
  entity,
  language,
  mainDocument,
  pagePlaintext,
  entityPageView,
  children,
}: EntityScopedProviderProps) => (
  <EntityProvider entity={entity}>
    <EntityPageViewProvider entityPageView={entityPageView}>
      <MetadataEditingProvider>
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
                    <EntityOverlayProvider>{children}</EntityOverlayProvider>
                  </TocProvider>
                </DocumentInteractionProvider>
              </RelationshipsPanelFiltersProvider>
            </RelationshipsSelectionProvider>
          </RelationshipsProvider>
        </EntityLanguageProvider>
      </MetadataEditingProvider>
    </EntityPageViewProvider>
  </EntityProvider>
);

export { EntityScopedProvider };
