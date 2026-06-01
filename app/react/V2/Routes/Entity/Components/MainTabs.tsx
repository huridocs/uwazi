import React from 'react';
import {
  Bars3CenterLeftIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { MetadataDisplay } from '#V2/Components/Metadata/MetadataDisplay.js';
import { RelationshipPropertyIcon } from '#V2/Components/CustomIcons/index.js';
import type { TabConfig } from '#V2/Components/UI/index.js';
import { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { TabLabel } from './TabLabel.js';
import { PDFView } from './PDFView.js';
import { FilesMainPanel } from './Files/index.js';

type MainTabsConfig = {
  DOCUMENT: string;
  METADATA: string;
  RELATIONSHIPS: string;
  FILES: string;
};

type BuildMainTabsParams = {
  entity?: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  mainTabs: MainTabsConfig;
};

const buildMainTabs = ({ entity, mainDocument, pagePlaintext, mainTabs }: BuildMainTabsParams): TabConfig[] => {
  const tabs: TabConfig[] = [];
  const filesCount = (entity?.documents?.length || 0) + (entity?.attachments?.length || 0);

  if (entity && mainDocument?.filename) {
    tabs.push({
      id: mainTabs.DOCUMENT,
      label: <TabLabel text="Document" icon={<DocumentTextIcon className="w-5 h-5" />} />,
      content: (
        <PDFView mainDocument={mainDocument} pagePlaintext={pagePlaintext} />
      ),
    });
  }

  if (entity) {
    tabs.push({
      id: mainTabs.METADATA,
      label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="w-5 h-5" />} />,
      content: <MetadataDisplay entity={entity} />,
    });
  }

  tabs.push({
    id: mainTabs.RELATIONSHIPS,
    label: <TabLabel text="Relationships" icon={<RelationshipPropertyIcon className="w-5 h-5" />} />,
    content: <span no-translate="true">Relationships</span>,
  });

  if (filesCount > 0) {
    tabs.push({
      id: mainTabs.FILES,
      label: <TabLabel text="Files" icon={<PaperClipIcon className="w-5 h-5" />} count={filesCount} />,
      content: <FilesMainPanel />,
    });
  }

  return tabs;
};

export { buildMainTabs };
