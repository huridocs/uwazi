import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { TabButtonDef } from '#V2/Components/UI/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { countEntityRelationships } from '#V2/formatters/index.js';
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
  filesCount?: number;
};

const getSideTabButtons = ({
  activeMainTab,
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
  metadataDirty,
  filesCount: filesCountOverride,
}: GetSideTabButtonsParams): TabButtonDef[] => {
  const buttons: TabButtonDef[] = [];
  const relationshipsCount = entity ? countEntityRelationships(entity, mainDocumentId) : 0;
  const relationshipsTabLabel = <TabLabel text="Relationships" count={relationshipsCount} />;
  const filesCount = filesCountOverride ?? 0;

  const pushMetadata = () => {
    if (!entity) return;
    buttons.push({
      id: SIDE_TAB.METADATA,
      label: <TabLabel text="Metadata" dirty={metadataDirty} />,
    });
  };

  const pushDocument = () => {
    if (!hasMainDocument) return;
    buttons.push({
      id: SIDE_TAB.DOCUMENT,
      label: <TabLabel text="Document" />,
    });
  };

  const pushFilesList = () => {
    buttons.push({
      id: SIDE_TAB.FILES,
      label: <TabLabel text="Files" count={filesCount} />,
    });
  };

  switch (activeMainTab) {
    case MAIN_TAB.DOCUMENT:
      pushMetadata();
      buttons.push(
        {
          id: SIDE_TAB.TOC,
          label: <TabLabel text="ToC" />,
        },
        {
          id: SIDE_TAB.RELATIONSHIPS,
          label: relationshipsTabLabel,
        }
      );
      pushFilesList();
      buttons.push({
        id: SIDE_TAB.SEARCH,
        label: <TabLabel text="Search" />,
      });
      break;
    case MAIN_TAB.METADATA:
      pushDocument();
      buttons.push({
        id: SIDE_TAB.RELATIONSHIPS,
        label: relationshipsTabLabel,
      });
      pushFilesList();
      buttons.push({
        id: SIDE_TAB.SEARCH,
        label: <TabLabel text="Search" />,
      });
      break;
    case MAIN_TAB.RELATIONSHIPS:
      pushDocument();
      pushMetadata();
      buttons.push(
        {
          id: SIDE_TAB.TOC,
          label: <TabLabel text="ToC" />,
        },
        {
          id: SIDE_TAB.SEARCH,
          label: <TabLabel text="Search" />,
        }
      );
      break;
    case MAIN_TAB.FILES:
      buttons.push({
        id: SIDE_TAB.FILE,
        label: <Translate>File</Translate>,
      });
      if (filesSideTabs?.showTranslationsTab) {
        buttons.push({
          id: SIDE_TAB.TRANSLATIONS,
          label: <TabLabel text="Translations" count={filesSideTabs.translationsCount} />,
        });
      }
      break;
    default:
      break;
  }

  return buttons;
};

export { getSideTabButtons };
export type { FilesSideTabsOptions };
