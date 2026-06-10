import React, { type ReactNode } from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';
import { DocumentTab } from './tabsContent/DocumentTab.js';
import { MetadataTab } from './tabsContent/MetadataTab.js';
import { RelationshipsTab } from './tabsContent/RelationshipsTab.js';
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
  const activeTabId = atomActiveTabId ?? urlActiveTabId;

  let content: ReactNode = null;

  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      if (mainDocument?.filename) {
        content = (
          <DocumentTab
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        );
      }
      break;
    case MAIN_TAB.METADATA:
      content = <MetadataTab entity={entity} />;
      break;
    case MAIN_TAB.RELATIONSHIPS:
      content = <RelationshipsTab />;
      break;
    case MAIN_TAB.FILES:
      content = <FilesTab />;
      break;
    default:
      break;
  }

  if (!content) return null;

  return (
    <div
      role="tabpanel"
      id={`entity-main-panel-${activeTabId}`}
      aria-labelledby={`entity-main-tab-${activeTabId}`}
      className="flex h-full min-h-0 w-full flex-col bg-warm"
    >
      {content}
    </div>
  );
};

export { MainTabsContent };
