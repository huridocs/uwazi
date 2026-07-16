import React, { useMemo } from 'react';
import { TabButtons } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { countEntityRelationships } from '#V2/formatters/index.js';
import { EntityLanguageBar, TabLabel } from '../Components/shared/index.js';
import { MAIN_TAB } from './tabIds.js';

type TabsMainButtonsProps = {
  entity: EntityType;
  mainDocument?: FileType;
  activeTabId: string;
  onTabChange: (tabId: string) => void;
};

const TabsMainButtons = ({
  entity,
  mainDocument,
  activeTabId,
  onTabChange,
}: TabsMainButtonsProps) => {
  const buttons = useMemo(() => {
    const items = [];
    const filesCount = (entity.documents?.length || 0) + (entity.attachments?.length || 0);
    const relationshipsCount = countEntityRelationships(entity);

    if (mainDocument?.filename) {
      items.push({
        id: MAIN_TAB.DOCUMENT,
        label: <TabLabel text="Document" />,
      });
    }

    items.push({
      id: MAIN_TAB.METADATA,
      label: <TabLabel text="Metadata" />,
    });

    items.push({
      id: MAIN_TAB.RELATIONSHIPS,
      label: <TabLabel text="Relationships" count={relationshipsCount} />,
    });

    items.push({
      id: MAIN_TAB.FILES,
      label: <TabLabel text="Files" count={filesCount} />,
    });

    return items;
  }, [entity, mainDocument?.filename]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 overflow-x-auto">
        <TabButtons
          groupId="entity-main"
          buttons={buttons}
          activeTabId={activeTabId}
          onTabChange={onTabChange}
          tabListAriaLabel="Entity primary"
        />
      </div>
      <EntityLanguageBar />
    </div>
  );
};

export { TabsMainButtons };
