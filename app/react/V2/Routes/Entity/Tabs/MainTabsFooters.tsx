import React from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { useMetadataEditing } from '../Components/context/index.js';
import { MAIN_TAB, isValidMainTab, type MainTabId } from './tabIds.js';
import { resolveActiveTabId } from './metadataTabSession.js';
import { DocumentTabFooter } from './footers/DocumentTabFooter.js';
import { MetadataTabFooter } from './footers/MetadataTabFooter.js';
import { RelationshipsTabFooter } from './footers/RelationshipsTabFooter.js';
import { FilesTabFooter } from './footers/FilesTabFooter.js';

type MainTabsFootersProps = {
  activeTabId: MainTabId;
  mainDocument?: FileType;
};

const MainTabsFooters = ({ activeTabId: urlActiveTabId, mainDocument }: MainTabsFootersProps) => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-main');
  const resolvedTabId = resolveActiveTabId(atomActiveTabId, urlActiveTabId);
  const activeTabId = isValidMainTab(resolvedTabId) ? resolvedTabId : urlActiveTabId;
  const { isEditing, editingHost } = useMetadataEditing();

  if (isEditing && editingHost === 'main') {
    return <MetadataTabFooter host="main" />;
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
