import React, { type ReactNode } from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { SIDE_TAB, type SideTabId } from './tabIds.js';
import { DocumentTab } from './tabsContent/DocumentTab.js';
import { MetadataTab } from './tabsContent/MetadataTab.js';
import { ToCTab } from './tabsContent/ToCTab.js';
import { RelationshipsPanel } from '../Components/relationships/index.js';
import { SearchTab } from './tabsContent/SearchTab.js';
import { FilesSideTab } from './tabsContent/FilesSideTab.js';
import { TranslationsTab } from './tabsContent/TranslationsTab.js';

type SideTabsContentProps = {
  activeTabId?: SideTabId;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

const SideTabsContent = ({
  activeTabId: urlActiveTabId,
  entity,
  mainDocument,
  pagePlaintext,
}: SideTabsContentProps) => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-side');
  const activeTabId = atomActiveTabId ?? urlActiveTabId;

  if (!activeTabId) return null;

  let content: ReactNode = null;

  switch (activeTabId) {
    case SIDE_TAB.DOCUMENT:
      if (mainDocument?.filename) {
        content = (
          <DocumentTab
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
            showViewModeSelect
          />
        );
      }
      break;
    case SIDE_TAB.METADATA:
      content = <MetadataTab entity={entity} />;
      break;
    case SIDE_TAB.TOC:
      content = <ToCTab mainDocument={mainDocument} />;
      break;
    case SIDE_TAB.RELATIONSHIPS:
      content = <RelationshipsPanel />;
      break;
    case SIDE_TAB.SEARCH:
      content = <SearchTab />;
      break;
    case SIDE_TAB.FILE:
      content = <FilesSideTab />;
      break;
    case SIDE_TAB.TRANSLATIONS:
      content = <TranslationsTab />;
      break;
    default:
      break;
  }

  if (!content) return null;

  return (
    <div
      role="tabpanel"
      id={`entity-side-panel-${activeTabId}`}
      aria-labelledby={`entity-side-tab-${activeTabId}`}
      className="flex h-full min-h-0 w-full flex-col"
    >
      {content}
    </div>
  );
};

export { SideTabsContent };
