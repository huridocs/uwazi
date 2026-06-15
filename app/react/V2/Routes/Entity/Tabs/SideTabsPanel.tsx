import React, { useMemo } from 'react';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { getSideTabButtons, type FilesSideTabsOptions } from './sideTabSets.js';
import type { MainTabId, SideTabId } from './tabIds.js';
import { TabsSideButtons } from './TabsSideButtons.js';
import { SideTabsContent } from './SideTabsContent.js';
import { SideTabsFooters } from './SideTabsFooters.js';

type SideTabsPanelProps = {
  activeMainTab: MainTabId;
  activeSideTab?: SideTabId;
  onSideTabChange: (tabId: string) => void;
  entity: EntityType;
  mainDocument?: FileType;
  pagePlaintext?: string;
  filesSideTabs?: FilesSideTabsOptions;
};

const SideTabsPanel = ({
  activeMainTab,
  activeSideTab,
  onSideTabChange,
  entity,
  mainDocument,
  pagePlaintext,
  filesSideTabs,
}: SideTabsPanelProps) => {
  const sideButtons = useMemo(
    () =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument: Boolean(mainDocument?.filename),
        filesSideTabs,
      }),
    [activeMainTab, entity, mainDocument?.filename, filesSideTabs]
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col gap-3 border-l border-border-soft">
      <div className="shrink-0 px-3 pt-2.5">
        <TabsSideButtons
          buttons={sideButtons}
          activeTabId={activeSideTab}
          onTabChange={onSideTabChange}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 grow overflow-hidden px-3 pt-2.5">
          <SideTabsContent
            activeTabId={activeSideTab}
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        </div>
        <SideTabsFooters activeTabId={activeSideTab} entity={entity} mainDocument={mainDocument} />
      </div>
    </div>
  );
};

export { SideTabsPanel };
