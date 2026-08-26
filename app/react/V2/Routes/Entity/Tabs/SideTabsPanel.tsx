import React, { useMemo } from 'react';
import { useTabGroup } from '#V2/Components/UI/index.js';
import type { TabButtonDef } from '#V2/Components/UI/Tabs/tabsAtoms.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { resolveActiveTabId } from '../Components/context/metadataEditingSession.js';
import { SIDE_TAB, isValidSideTab, type SideTabId } from './tabIds.js';
import { TabsSideButtons } from './TabsSideButtons.js';
import { SideTabsContent } from './SideTabsContent.js';
import { SideTabsFooters } from './SideTabsFooters.js';
import { RelationshipsFiltersDrawer } from '../Components/relationships/index.js';
import { EntityOverlay } from '../Components/relationships/overlay/EntityOverlay.js';

type SideTabsPanelProps = {
  activeSideTab?: SideTabId;
  syncSideTabId?: SideTabId;
  sideButtons: TabButtonDef[];
  onSideTabChange: (tabId: string) => void;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
};

const SideTabsPanel = ({
  activeSideTab,
  syncSideTabId,
  sideButtons,
  onSideTabChange,
  entity,
  mainDocument,
  pagePlaintext,
}: SideTabsPanelProps) => {
  const { activeTabId: atomSideTab } = useTabGroup('entity-side');
  const displaySideTab = useMemo(() => {
    const resolved = resolveActiveTabId(atomSideTab, activeSideTab);
    return isValidSideTab(resolved) ? resolved : activeSideTab;
  }, [activeSideTab, atomSideTab]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden border-l border-border-soft">
      <EntityOverlay />
      <div className="shrink-0 px-3 pt-2.5">
        <TabsSideButtons
          buttons={sideButtons}
          activeTabId={displaySideTab}
          syncActiveTabId={syncSideTabId}
          onTabChange={onSideTabChange}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 grow overflow-hidden">
          <SideTabsContent
            activeTabId={displaySideTab}
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        </div>
        <SideTabsFooters activeTabId={displaySideTab} mainDocument={mainDocument} />
      </div>
      {displaySideTab === SIDE_TAB.RELATIONSHIPS && <RelationshipsFiltersDrawer />}
    </div>
  );
};

export { SideTabsPanel };
