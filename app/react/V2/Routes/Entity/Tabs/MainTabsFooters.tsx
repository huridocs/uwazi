import React from 'react';
import type { FileType } from '#V2/api/entities/types.js';
import { useEntityPageView } from '../Components/context/index.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';
import { useResolvedEntityMainTab } from './hooks/useResolvedEntityMainTab.js';
import { DocumentTabFooter } from './footers/DocumentTabFooter.js';
import { MetadataTabFooter } from './footers/MetadataTabFooter.js';
import { RelationshipsTabFooter } from './footers/RelationshipsTabFooter.js';
import { FilesTabFooter } from './footers/FilesTabFooter.js';

type MainTabsFootersProps = {
  activeTabId: MainTabId;
  mainDocument?: FileType;
};

const MainTabsFooters = ({ activeTabId: urlActiveTabId, mainDocument }: MainTabsFootersProps) => {
  const activeTabId = useResolvedEntityMainTab(urlActiveTabId);
  const { hasEntityPageView } = useEntityPageView();
  const metadataActive = activeTabId === MAIN_TAB.METADATA;

  // Page view replaces metadata on main — no metadata edit footer there.
  if (hasEntityPageView && metadataActive) {
    return null;
  }

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
