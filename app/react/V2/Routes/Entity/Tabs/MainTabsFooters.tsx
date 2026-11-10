import React from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { useExitRelationshipsEdit } from '#V2/Routes/Entity/Components/context/index.js';
import { MAIN_TAB, SIDE_TAB, isValidMainTab, type SideTabId } from './tabIds.js';
import { useResolvedEntityMainTab } from './hooks/useResolvedEntityMainTab.js';
import { DocumentTabFooter } from './footers/DocumentTabFooter.js';
import { MetadataTabFooter } from './footers/MetadataTabFooter.js';
import { RelationshipsTabFooter } from './footers/RelationshipsTabFooter.js';
import { FilesTabFooter } from './footers/FilesTabFooter.js';
import { ToCTabFooter } from './footers/ToCTabFooter.js';
import { SearchTabFooter } from './footers/SearchTabFooter.js';
import { FileTabFooter } from './footers/FileTabFooter.js';
import { TranslationsTabFooter } from './footers/TranslationsTabFooter.js';

type MainTabsFootersProps = {
  activeTabId: SideTabId;
  mainDocument?: FileType;
};

const MainTabsFooters = ({ activeTabId: urlActiveTabId, mainDocument }: MainTabsFootersProps) => {
  const resolvedMainTab = useResolvedEntityMainTab(
    isValidMainTab(urlActiveTabId) ? urlActiveTabId : MAIN_TAB.METADATA
  );
  const activeTabId = isValidMainTab(urlActiveTabId) ? resolvedMainTab : urlActiveTabId;
  useExitRelationshipsEdit(activeTabId === MAIN_TAB.RELATIONSHIPS);
  if (activeTabId === SIDE_TAB.TOC) return <ToCTabFooter mainDocument={mainDocument} />;
  if (activeTabId === SIDE_TAB.SEARCH) return <SearchTabFooter />;
  if (activeTabId === SIDE_TAB.FILE) return <FileTabFooter />;
  if (activeTabId === SIDE_TAB.TRANSLATIONS) return <TranslationsTabFooter />;
  if (!isValidMainTab(activeTabId)) return null;

  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      if (!mainDocument?.filename) return null;
      return <DocumentTabFooter mainDocument={mainDocument} />;
    case MAIN_TAB.METADATA:
      return <MetadataTabFooter host="main" />;
    case MAIN_TAB.RELATIONSHIPS:
      return <RelationshipsTabFooter />;
    case MAIN_TAB.FILES:
      return <FilesTabFooter />;
    default:
      return null;
  }
};

export { MainTabsFooters };
