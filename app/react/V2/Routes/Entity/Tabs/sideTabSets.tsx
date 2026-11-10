import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { TabButtonDef } from '#V2/Components/UI/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { TabLabel } from '../Components/shared/index.js';
import { resolvePaneTabs } from './paneTabSelection.js';
import { SIDE_TAB, type MainTabId } from './tabIds.js';

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

const pickTabButtons = (catalog: TabButtonDef[], ids: string[]): TabButtonDef[] =>
  ids.flatMap(id => {
    const button = catalog.find(item => item.id === id);
    return button ? [button] : [];
  });

type CatalogParams = Omit<GetSideTabButtonsParams, 'activeMainTab'>;

const metadataTab = ({ entity, metadataDirty }: CatalogParams): TabButtonDef[] =>
  entity
    ? [
        {
          id: SIDE_TAB.METADATA,
          name: 'Metadata',
          label: <TabLabel text="Metadata" dirty={metadataDirty} />,
        },
      ]
    : [];

const documentTabs = ({ hasMainDocument }: CatalogParams): TabButtonDef[] =>
  hasMainDocument
    ? [
        { id: SIDE_TAB.DOCUMENT, name: 'Document', label: <TabLabel text="Document" /> },
        { id: SIDE_TAB.TOC, name: 'ToC', label: <TabLabel text="ToC" /> },
      ]
    : [];

const relationshipTab = ({ relationshipsCount = 0 }: CatalogParams): TabButtonDef => ({
  id: SIDE_TAB.RELATIONSHIPS,
  name: 'Relationships',
  label: <TabLabel text="Relationships" count={relationshipsCount} />,
  menuLabel: <Translate>Relationships</Translate>,
  accessory: relationshipsCount,
});

const filesTab = ({ filesCount: filesCountOverride }: CatalogParams): TabButtonDef => {
  const filesCount = filesCountOverride ?? 0;
  return {
    id: SIDE_TAB.FILES,
    name: 'Files',
    label: <TabLabel text="Files" count={filesCount} />,
    menuLabel: <Translate>Files</Translate>,
    accessory: filesCount,
  };
};

const searchTab = ({ searchDirty }: CatalogParams): TabButtonDef => ({
  id: SIDE_TAB.SEARCH,
  name: 'Search',
  label: <TabLabel text="Search" dirty={searchDirty} />,
});

const fileTab = (): TabButtonDef => ({
  id: SIDE_TAB.FILE,
  name: 'File',
  label: <Translate>File</Translate>,
});

const translationsTab = ({ filesSideTabs }: CatalogParams): TabButtonDef[] =>
  filesSideTabs?.showTranslationsTab
    ? [
        {
          id: SIDE_TAB.TRANSLATIONS,
          name: 'Translations',
          label: <TabLabel text="Translations" count={filesSideTabs.translationsCount} />,
          menuLabel: <Translate>Translations</Translate>,
          accessory: filesSideTabs.translationsCount,
        },
      ]
    : [];

const buildEntityTabCatalog = (params: CatalogParams): TabButtonDef[] => [
  ...metadataTab(params),
  ...documentTabs(params),
  relationshipTab(params),
  filesTab(params),
  searchTab(params),
  fileTab(),
  ...translationsTab(params),
];

const getSideTabButtons = ({
  activeMainTab,
  ...catalogParams
}: GetSideTabButtonsParams): TabButtonDef[] => {
  const panes = resolvePaneTabs({
    left: activeMainTab,
    rightFromUrl: null,
    availability: {
      hasMainDocument: catalogParams.hasMainDocument,
      showTranslationsTab: Boolean(catalogParams.filesSideTabs?.showTranslationsTab),
      hasEntity: Boolean(catalogParams.entity),
    },
  });
  return pickTabButtons(buildEntityTabCatalog(catalogParams), panes.rightIds);
};

const translationsFilesSideTabs = (translationsCount: number): FilesSideTabsOptions => ({
  showTranslationsTab: true,
  translationsCount,
});

export { buildEntityTabCatalog, getSideTabButtons, pickTabButtons, translationsFilesSideTabs };
export type { FilesSideTabsOptions };
