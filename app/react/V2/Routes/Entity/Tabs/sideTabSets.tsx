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
  filesSideTabs?: FilesSideTabsOptions;
};

const getSideTabButtons = ({
  activeMainTab,
  entity,
  hasMainDocument,
  filesSideTabs,
}: GetSideTabButtonsParams): TabButtonDef[] => {
  const buttons: TabButtonDef[] = [];
  const relationshipsCount = entity ? countEntityRelationships(entity) : 0;
  const relationshipsTabLabel = <TabLabel text="Relationships" count={relationshipsCount} />;

  const pushMetadata = () => {
    if (!entity) return;
    buttons.push({
      id: SIDE_TAB.METADATA,
      label: <TabLabel text="Metadata" />,
    });
  };

  const pushDocument = () => {
    if (!hasMainDocument) return;
    buttons.push({
      id: SIDE_TAB.DOCUMENT,
      label: <TabLabel text="Document" />,
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
        },
        {
          id: SIDE_TAB.SEARCH,
          label: <TabLabel text="Search" />,
        }
      );
      break;
    case MAIN_TAB.METADATA:
      pushDocument();
      buttons.push(
        {
          id: SIDE_TAB.RELATIONSHIPS,
          label: relationshipsTabLabel,
        },
        {
          id: SIDE_TAB.SEARCH,
          label: <TabLabel text="Search" />,
        }
      );
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
