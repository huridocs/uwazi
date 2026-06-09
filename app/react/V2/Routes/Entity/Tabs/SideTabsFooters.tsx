import React from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { SIDE_TAB, type SideTabId } from './tabIds.js';
import { DocumentTabFooter } from './footers/DocumentTabFooter.js';
import { MetadataTabFooter } from './footers/MetadataTabFooter.js';
import { ToCTabFooter } from './footers/ToCTabFooter.js';
import { ReferencesTabFooter } from './footers/ReferencesTabFooter.js';
import { RelationshipsSideTabFooter } from './footers/RelationshipsSideTabFooter.js';
import { SearchTabFooter } from './footers/SearchTabFooter.js';
import { FileTabFooter } from './footers/FileTabFooter.js';
import { TranslationsTabFooter } from './footers/TranslationsTabFooter.js';

type SideTabsFootersProps = {
  activeTabId?: SideTabId;
  mainDocument?: FileType;
};

const SideTabsFooters = ({ activeTabId: urlActiveTabId, mainDocument }: SideTabsFootersProps) => {
  const { activeTabId: atomActiveTabId } = useTabGroup('entity-side');
  const activeTabId = atomActiveTabId ?? urlActiveTabId;

  if (!activeTabId) return null;

  switch (activeTabId) {
    case SIDE_TAB.DOCUMENT:
      if (!mainDocument?.filename) return null;
      return <DocumentTabFooter mainDocument={mainDocument} />;
    case SIDE_TAB.METADATA:
      return <MetadataTabFooter />;
    case SIDE_TAB.TOC:
      return <ToCTabFooter mainDocument={mainDocument} />;
    case SIDE_TAB.REFERENCES:
      return <ReferencesTabFooter />;
    case SIDE_TAB.RELATIONSHIPS:
      return <RelationshipsSideTabFooter />;
    case SIDE_TAB.SEARCH:
      return <SearchTabFooter />;
    case SIDE_TAB.FILE:
      return <FileTabFooter />;
    case SIDE_TAB.TRANSLATIONS:
      return <TranslationsTabFooter />;
    default:
      return null;
  }
};

export { SideTabsFooters };
