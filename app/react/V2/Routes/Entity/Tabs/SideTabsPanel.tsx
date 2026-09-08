import React, { useMemo } from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { useEntityFiles } from '../Components/index.js';
import { SIDE_TAB } from './tabIds.js';
import { TabsSideButtons } from './TabsSideButtons.js';
import { SideTabsContent } from './SideTabsContent.js';
import { SideTabsFooters } from './SideTabsFooters.js';
import { RelationshipsFiltersDrawer } from '../Components/relationships/index.js';
import { EntityOverlay } from '../Components/relationships/overlay/EntityOverlay.js';
import { useEntitySideTabs } from './hooks/useEntitySideTabs.js';
import { translationsFilesSideTabs } from './sideTabSets.js';

type SideTabsPanelProps = {
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

const SideTabsPanel = ({ entity, mainDocument, pagePlaintext }: SideTabsPanelProps) => {
  const { primaryRows } = useEntityFiles();
  const filesSideTabs = useMemo(
    () => translationsFilesSideTabs(primaryRows.length),
    [primaryRows.length]
  );
  const sideTabs = useEntitySideTabs({
    entity,
    hasMainDocument: Boolean(mainDocument?.filename),
    mainDocumentId: mainDocument?._id,
    filesSideTabs,
  });

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden border-l border-border-soft">
      <EntityOverlay />
      <div className="shrink-0 px-3 pt-2.5">
        <TabsSideButtons
          buttons={sideTabs.sideButtons}
          activeTabId={sideTabs.activeSideTab}
          syncActiveTabId={sideTabs.syncSideTabId}
          onTabChange={sideTabs.onSideTabChange}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 grow overflow-hidden">
          <SideTabsContent
            activeTabId={sideTabs.activeSideTab}
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        </div>
        <SideTabsFooters activeTabId={sideTabs.activeSideTab} mainDocument={mainDocument} />
      </div>
      {sideTabs.activeSideTab === SIDE_TAB.RELATIONSHIPS && <RelationshipsFiltersDrawer />}
    </div>
  );
};

export { SideTabsPanel };
