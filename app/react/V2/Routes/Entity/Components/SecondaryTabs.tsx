import React from 'react';
import {
  Bars3CenterLeftIcon,
  DocumentTextIcon,
  LanguageIcon,
  LinkIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { RelationshipPropertyIcon } from '#V2/Components/CustomIcons/index.js';
import type { TabConfig } from '#V2/Components/UI/index.js';
import { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { TabLabel } from './TabLabel.js';
import { PDFView } from './PDFView.js';
import { ToCPanel } from './ToC/ToCPanel.js';
import { ReferencesPanel } from './ReferencesPanel/ReferencesPanel.js';
import { SearchResults } from './SearchResults.js';
import { FileSideTabContent } from './Files/FileSideTabContent.js';
import { TranslationsSideTabContent } from './Files/TranslationsSideTabContent.js';

type MainTabsConfig = {
  DOCUMENT: string;
  METADATA: string;
  RELATIONSHIPS: string;
  FILES: string;
};

type SideTabsConfig = {
  DOCUMENT: string;
  METADATA: string;
  TOC: string;
  REFERENCES: string;
  RELATIONSHIPS: string;
  SEARCH: string;
  FILE: string;
  TRANSLATIONS: string;
};

type FilesSideTabsOptions = {
  showTranslationsTab: boolean;
  translationsCount: number;
};

type SideTabConfig = TabConfig;

type BuildSecondaryTabsParams = {
  entity?: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  mainTabs: MainTabsConfig;
  sideTabs: SideTabsConfig;
  filesSideTabs?: FilesSideTabsOptions;
};

const buildSecondaryTabsByMain = ({
  entity,
  mainDocument,
  pagePlaintext,
  mainTabs,
  sideTabs,
  filesSideTabs,
}: BuildSecondaryTabsParams): Record<string, SideTabConfig[]> => ({
  [mainTabs.DOCUMENT]: [
    {
      id: sideTabs.METADATA,
      label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
      content: entity ? <MetadataDisplay entity={entity} /> : <Translate>Loading</Translate>,
    },
    {
      id: sideTabs.TOC,
      label: <TabLabel text="ToC" icon={<ListBulletIcon className="w-5 h-5" />} />,
      content: <ToCPanel toc={mainDocument?.toc} generatedToc={mainDocument?.generatedToc} file={mainDocument} />,
    },
    {
      id: sideTabs.REFERENCES,
      label: <TabLabel text="References" icon={<LinkIcon className="w-5 h-5" />} />,
      content: <ReferencesPanel entity={entity} mainDocument={mainDocument} />,
    },
    {
      id: sideTabs.RELATIONSHIPS,
      label: <TabLabel text="Relationships" icon={<RelationshipPropertyIcon className="w-5 h-5" />} />,
      content: <div no-translate="true">This content is not yet available</div>,
    },
    {
      id: sideTabs.SEARCH,
      label: <TabLabel text="Search" icon={<MagnifyingGlassIcon className="w-5 h-5" />} />,
      content: <SearchResults />,
    },
  ],
  [mainTabs.METADATA]: [
    ...(entity && mainDocument?.filename
      ? [
          {
            id: sideTabs.DOCUMENT,
            label: <TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />,
            content: (
              <PDFView
                mainDocument={mainDocument}
                pagePlaintext={pagePlaintext}
                showViewModeSelect
              />
            ),
          },
        ]
      : []),
    {
      id: sideTabs.RELATIONSHIPS,
      label: <TabLabel text="Relationships" icon={<RelationshipPropertyIcon className="w-5 h-5" />} />,
      content: <div no-translate="true">This content is not yet available</div>,
    },
    {
      id: sideTabs.SEARCH,
      label: <TabLabel text="Search" icon={<MagnifyingGlassIcon className="w-5 h-5" />} />,
      content: <SearchResults />,
    },
  ],
  [mainTabs.RELATIONSHIPS]: [
    {
      id: sideTabs.METADATA,
      label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
      content: entity ? <MetadataDisplay entity={entity} /> : <Translate>Loading</Translate>,
    },
  ],
  [mainTabs.FILES]: [
    {
      id: sideTabs.FILE,
      label: <Translate>File</Translate>,
      content: <FileSideTabContent />,
    },
    ...(filesSideTabs?.showTranslationsTab
      ? [
          {
            id: sideTabs.TRANSLATIONS,
            label: (
              <TabLabel
                text="Translations"
                icon={<LanguageIcon className="w-5 h-5" />}
                count={filesSideTabs.translationsCount}
              />
            ),
            content: <TranslationsSideTabContent />,
          },
        ]
      : []),
  ],
});

export { buildSecondaryTabsByMain };
export type { SideTabConfig, FilesSideTabsOptions };
