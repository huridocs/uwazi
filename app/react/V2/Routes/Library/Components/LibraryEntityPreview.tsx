/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { DocumentPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import { useTabGroup } from '#V2/Components/UI/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import {
  AddFileModal,
  EntityFilesProvider,
  EntityMainPaneHeader,
  EntityScopedProvider,
  FilesDeleteConfirmationModal,
  useEntityLanguage,
  useEntityScopedEntity,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/index.js';
import { CreateRelationshipModal } from '#V2/Routes/Entity/Components/relationships/create-reference/CreateRelationshipModal.js';
import { useResetRelationshipsOnDocumentChange } from '#V2/Routes/Entity/Components/relationships/hooks/useDocumentRelationships.js';
import {
  MAIN_TAB,
  MainTabsContent,
  TabsMainButtons,
  isValidMainTab,
  type MainTabId,
} from '#V2/Routes/Entity/Tabs/index.js';
import { EntityTabsProvider } from '#V2/Routes/Entity/Tabs/EntityTabsContext.js';
import type { EntityTabsState } from '#V2/Routes/Entity/Tabs/hooks/entityTabsTypes.js';
import { LibraryEntityPreviewFooter } from './LibraryEntityPreviewFooter.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { useLibraryPreviewEntity } from './useLibraryPreviewEntity.js';

type LibraryEntityPreviewProps = {
  sharedId: string;
  entityBasePath: string;
  onClose: () => void;
};

const noop = () => undefined;

const libraryPreviewTabs = (mainTabId: MainTabId): EntityTabsState => ({
  activeMainTab: mainTabId,
  activeSideTab: undefined,
  explicitSideTab: undefined,
  syncSideTabId: undefined,
  sideButtons: [],
  relationshipsOnMain: mainTabId === MAIN_TAB.RELATIONSHIPS,
  documentOnMain: mainTabId === MAIN_TAB.DOCUMENT,
  onMainTabChange: noop,
  onSideTabChange: noop,
  focusSideTab: noop,
  stageSideTab: noop,
  focusRelationshipsPanel: noop,
  focusDocumentPanel: noop,
});

const EntityFilesFromEntity = ({ children }: { children: React.ReactNode }) => {
  const entity = useEntityScopedEntity();
  return <EntityFilesProvider entity={entity}>{children}</EntityFilesProvider>;
};

const EntityCreateRelationshipModal = () => {
  const { mainDocument } = useEntityLanguage();
  return <CreateRelationshipModal mainDocument={mainDocument} />;
};

const LibraryMetadataCopyFrom = () => (
  <div className="shrink-0 px-4 pt-3">
    <LibraryFooterButton
      icon={<DocumentPlusIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
      onClick={() => undefined}
    >
      <Translate>Copy from...</Translate>
    </LibraryFooterButton>
  </div>
);

const LibraryEntityPreviewView = ({
  entityBasePath,
  onClose,
}: {
  entityBasePath: string;
  onClose: () => void;
}) => {
  const entity = useEntityScopedEntity();
  const { mainDocument, pagePlaintext, isRtl } = useEntityLanguage();
  useResetRelationshipsOnDocumentChange();
  const hasMainDocument = Boolean(mainDocument?.filename);
  const defaultMainTab = hasMainDocument ? MAIN_TAB.DOCUMENT : MAIN_TAB.METADATA;
  const { activeTabId: atomMainTabId } = useTabGroup('entity-main');
  const mainTabId =
    isValidMainTab(atomMainTabId) && (atomMainTabId !== MAIN_TAB.DOCUMENT || hasMainDocument)
      ? atomMainTabId
      : defaultMainTab;
  const { isEditing, formMountHost } = useMetadataEditing();
  const showCopyFrom = isEditing && formMountHost === 'main' && mainTabId === MAIN_TAB.METADATA;
  const entityTabs = useMemo(() => libraryPreviewTabs(mainTabId), [mainTabId]);

  return (
    <EntityTabsProvider value={entityTabs}>
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
        dir={isRtl ? 'rtl' : 'ltr'}
        data-testid="library-entity-preview"
      >
        <div className="shrink-0">
          <div className="relative">
            <div className="pe-8">
              <EntityMainPaneHeader entity={entity} showDocumentViewMode={false} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute end-2 top-2.5 shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
              aria-label={t('System', 'Close', null, false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="px-3 pt-2 pb-1">
            <TabsMainButtons
              entity={entity}
              mainDocument={mainDocument}
              onTabChange={() => undefined}
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {showCopyFrom ? <LibraryMetadataCopyFrom /> : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <MainTabsContent
              activeTabId={mainTabId}
              entity={entity}
              mainDocument={mainDocument}
              pagePlaintext={pagePlaintext}
            />
          </div>
          <LibraryEntityPreviewFooter
            entityBasePath={entityBasePath}
            onClose={onClose}
            mainTabId={mainTabId}
          />
        </div>
      </div>
    </EntityTabsProvider>
  );
};

const PreviewStatus = ({ children }: { children: React.ReactNode }) => (
  <div
    className="flex h-full min-h-0 items-center justify-center bg-paper p-4 text-sm text-ink-tertiary"
    data-testid="library-entity-preview"
  >
    {children}
  </div>
);

const LibraryEntityPreview = ({ sharedId, entityBasePath, onClose }: LibraryEntityPreviewProps) => {
  const { entity, loading, error } = useLibraryPreviewEntity(sharedId);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <PreviewStatus>
        <span aria-live="polite" aria-busy="true">
          <Translate>Loading</Translate>
        </span>
      </PreviewStatus>
    );
  }

  if (error || !entity) {
    return (
      <PreviewStatus>
        <span aria-live="polite">
          <Translate>NO DATA AVAILABLE</Translate>
        </span>
      </PreviewStatus>
    );
  }

  const { language } = entity;
  const mainDocument = getMainDocument(readyDocuments(entity.documents), language, defaultLanguage);

  return (
    <ErrorBoundary>
      <EntityScopedProvider
        key={entity.sharedId}
        entity={entity}
        language={language}
        mainDocument={mainDocument}
      >
        <EntityFilesFromEntity>
          <FilesDeleteConfirmationModal />
          <AddFileModal />
          <LibraryEntityPreviewView entityBasePath={entityBasePath} onClose={onClose} />
        </EntityFilesFromEntity>
        <EntityCreateRelationshipModal />
      </EntityScopedProvider>
    </ErrorBoundary>
  );
};

export type { LibraryEntityPreviewProps };
export { LibraryEntityPreview };
