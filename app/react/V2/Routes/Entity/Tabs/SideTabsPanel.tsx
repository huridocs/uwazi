import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles } from '#V2/formatters/index.js';
import { useMetadataEditing } from '../Components/context/index.js';
import { getSideTabButtons, type FilesSideTabsOptions } from './sideTabSets.js';
import { SIDE_TAB, type MainTabId, type SideTabId } from './tabIds.js';
import { TabsSideButtons } from './TabsSideButtons.js';
import { SideTabsContent } from './SideTabsContent.js';
import { SideTabsFooters } from './SideTabsFooters.js';
import { RelationshipsFiltersDrawer } from '../Components/relationships/index.js';
import { EntityOverlay } from '../Components/relationships/overlay/EntityOverlay.js';

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
  const { isDirty } = useMetadataEditing();
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const filesCount = useMemo(
    () => countEntityFiles(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );
  const sideButtons = useMemo(
    () =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument: Boolean(mainDocument?.filename),
        mainDocumentId: mainDocument?._id,
        filesSideTabs,
        metadataDirty: isDirty,
        filesCount,
      }),
    [
      activeMainTab,
      entity,
      mainDocument?.filename,
      mainDocument?._id,
      filesSideTabs,
      isDirty,
      filesCount,
    ]
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden border-l border-border-soft">
      <EntityOverlay />
      <div className="shrink-0 px-3 pt-2.5">
        <TabsSideButtons
          buttons={sideButtons}
          activeTabId={activeSideTab}
          onTabChange={onSideTabChange}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 grow overflow-hidden">
          <SideTabsContent
            activeTabId={activeSideTab}
            entity={entity}
            mainDocument={mainDocument}
            pagePlaintext={pagePlaintext}
          />
        </div>
        <SideTabsFooters activeTabId={activeSideTab} mainDocument={mainDocument} />
      </div>
      {activeSideTab === SIDE_TAB.RELATIONSHIPS && <RelationshipsFiltersDrawer />}
    </div>
  );
};

export { SideTabsPanel };
