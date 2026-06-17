import React from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { Entity, FileType } from '#V2/api/entities/types.js';
import { MAIN_TAB, type MainTabId } from './tabIds.js';
import { DocumentTabFooter } from './footers/DocumentTabFooter.js';
import { MetadataTabFooter } from './footers/MetadataTabFooter.js';
import { RelationshipsTabFooter } from './footers/RelationshipsTabFooter.js';
import { FilesTabFooter } from './footers/FilesTabFooter.js';

type MainTabsFootersProps = {
  activeTabId: MainTabId;
  entity: Entity;
  mainDocument?: FileType;
};

const MainTabsFooters = ({
  activeTabId: urlActiveTabId,
  entity,
  mainDocument,
}: MainTabsFootersProps) => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-main');
  const activeTabId = atomActiveTabId ?? urlActiveTabId;

  switch (activeTabId) {
    case MAIN_TAB.DOCUMENT:
      if (!mainDocument?.filename) return null;
      return <DocumentTabFooter mainDocument={mainDocument} />;
    case MAIN_TAB.METADATA:
      return <MetadataTabFooter />;
    case MAIN_TAB.RELATIONSHIPS:
      return <RelationshipsTabFooter entity={entity} />;
    case MAIN_TAB.FILES:
      return <FilesTabFooter />;
    default:
      return null;
  }
};

export { MainTabsFooters };
