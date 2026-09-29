import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { TabButtonDef } from '#V2/Components/UI/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { TabLabel } from '../Components/shared/index.js';
import { MAIN_TAB, SIDE_TAB, type MainTabId } from './tabIds.js';

type FilesSideTabsOptions = {
  showTranslationsTab: boolean;
  translationsCount: number;
};

type GetSideTabButtonsParams = {
  activeMainTab: MainTabId;
  entity?: EntityType;
  hasMainDocument: boolean;
  mainDocumentId?: string;
  filesSideTabs?: FilesSideTabsOptions;
  metadataDirty?: boolean;
  searchDirty?: boolean;
  filesCount?: number;
  relationshipsCount?: number;
};

const getSideTabButtons = ({
  activeMainTab,
  entity,
  hasMainDocument,
  filesSideTabs,
  metadataDirty,
  searchDirty,
  filesCount: filesCountOverride,
  relationshipsCount = 0,
}: GetSideTabButtonsParams): TabButtonDef[] => {
  const buttons: TabButtonDef[] = [];
  const relationshipsTabLabel = <TabLabel text="Relationships" count={relationshipsCount} />;
  const filesCount = filesCountOverride ?? 0;

  const pushMetadata = () => {
    if (!entity) return;
    buttons.push({
      id: SIDE_TAB.METADATA,
      name: 'Metadata',
      label: <TabLabel text="Metadata" dirty={metadataDirty} />,
    });
  };

  const pushDocument = () => {
    if (!hasMainDocument) return;
    buttons.push({
      id: SIDE_TAB.DOCUMENT,
      name: 'Document',
      label: <TabLabel text="Document" />,
    });
  };

  const pushFilesList = () => {
    buttons.push({
      id: SIDE_TAB.FILES,
      name: 'Files',
      label: <TabLabel text="Files" count={filesCount} />,
    });
  };

  switch (activeMainTab) {
    case MAIN_TAB.DOCUMENT:
      pushMetadata();
      buttons.push(
        {
          id: SIDE_TAB.TOC,
          name: 'ToC',
          label: <TabLabel text="ToC" />,
        },
        {
          id: SIDE_TAB.RELATIONSHIPS,
          name: 'Relationships',
          label: relationshipsTabLabel,
        }
      );
      pushFilesList();
      buttons.push({
        id: SIDE_TAB.SEARCH,
        name: 'Search',
        label: <TabLabel text="Search" dirty={searchDirty} />,
      });
      break;
    case MAIN_TAB.METADATA:
      pushDocument();
      buttons.push({
        id: SIDE_TAB.RELATIONSHIPS,
        name: 'Relationships',
        label: relationshipsTabLabel,
      });
      pushFilesList();
      buttons.push({
        id: SIDE_TAB.SEARCH,
        name: 'Search',
        label: <TabLabel text="Search" dirty={searchDirty} />,
      });
      break;
    case MAIN_TAB.RELATIONSHIPS:
      pushDocument();
      pushMetadata();
      pushFilesList();
      break;
    case MAIN_TAB.FILES:
      buttons.push({
        id: SIDE_TAB.FILE,
        name: 'File',
        label: <Translate>File</Translate>,
      });
      if (filesSideTabs?.showTranslationsTab) {
        buttons.push({
          id: SIDE_TAB.TRANSLATIONS,
          name: 'Translations',
          label: <TabLabel text="Translations" count={filesSideTabs.translationsCount} />,
        });
      }
      break;
    default:
      break;
  }

  return buttons;
};

const translationsFilesSideTabs = (translationsCount: number): FilesSideTabsOptions => ({
  showTranslationsTab: true,
  translationsCount,
});

export { getSideTabButtons, translationsFilesSideTabs };
export type { FilesSideTabsOptions };
