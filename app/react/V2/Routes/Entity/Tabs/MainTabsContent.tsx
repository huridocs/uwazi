import React, { type ReactNode } from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useMetadataEditing } from '../Components/context/index.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';
import { useEntityTabNavigation } from './hooks/useEntityTabNavigation.js';
import { DocumentTab } from './tabsContent/DocumentTab.js';
import { MetadataTab } from './tabsContent/MetadataTab.js';
import {
  RelationshipsPanel,
  RelationshipsFiltersDrawer,
} from '../Components/relationships/index.js';
import { FilesTab } from './tabsContent/FilesTab.js';

type MainTabsContentProps = {
  activeTabId: MainTabId;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

const MainTabsContent = ({
  activeTabId: urlActiveTabId,
  entity,
  mainDocument,
  pagePlaintext,
}: MainTabsContentProps) => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-main');
  const activeTabId = atomActiveTabId || urlActiveTabId;
  const { focusDocumentPanel, relationshipsOnMain } = useEntityTabNavigation();
  const { isEditing, editingHost } = useMetadataEditing();
  const metadataActive = activeTabId === MAIN_TAB.METADATA;
  const keepMetadata = metadataActive || (isEditing && editingHost === 'main');

  let content: ReactNode = null;

  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      if (mainDocument?.filename) {
        content = (
          <DocumentTab entity={entity} mainDocument={mainDocument} pagePlaintext={pagePlaintext} />
        );
      }
      break;
    case MAIN_TAB.METADATA:
      break;
    case MAIN_TAB.RELATIONSHIPS:
      content = (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-2">
          <RelationshipsPanel
            focusDocumentOnSelect={relationshipsOnMain}
            onFocusDocument={focusDocumentPanel}
          />
        </div>
      );
      break;
    case MAIN_TAB.FILES:
      content = <FilesTab />;
      break;
    default:
      break;
  }

  if (!content && !keepMetadata) return null;

  return (
    <div
      role="tabpanel"
      id={`entity-main-panel-${activeTabId}`}
      aria-labelledby={`entity-main-tab-${activeTabId}`}
      className={`flex h-full min-h-0 w-full flex-col ${metadataActive ? 'bg-paper' : 'bg-warm'}`}
    >
      {keepMetadata ? (
        <div className={metadataActive ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
          <MetadataTab entity={entity} host="main" />
        </div>
      ) : null}
      {!metadataActive ? content : null}
      {activeTabId === MAIN_TAB.RELATIONSHIPS && <RelationshipsFiltersDrawer />}
    </div>
  );
};

export { MainTabsContent };
