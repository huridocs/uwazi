import React, { useMemo } from 'react';
import { Bars3CenterLeftIcon, DocumentTextIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { TabButtons } from '#V2/Components/UI/index.js';
import { RelationshipPropertyIcon } from '#V2/Components/CustomIcons/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { countEntityRelationships } from '#V2/formatters/index.js';
import { TabLabel } from '../Components/shared/TabLabel.js';
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
        label: <TabLabel text="Document" icon={<DocumentTextIcon className="h-5 w-5" />} />,
      });
    }

    items.push({
      id: MAIN_TAB.METADATA,
      label: <TabLabel text="Metadata" icon={<Bars3CenterLeftIcon className="h-5 w-5" />} />,
    });

    items.push({
      id: MAIN_TAB.RELATIONSHIPS,
      label: (
        <TabLabel
          text="Relationships"
          icon={<RelationshipPropertyIcon className="h-5 w-5" />}
          count={relationshipsCount}
        />
      ),
    });

    if (filesCount > 0) {
      items.push({
        id: MAIN_TAB.FILES,
        label: (
          <TabLabel text="Files" icon={<PaperClipIcon className="h-5 w-5" />} count={filesCount} />
        ),
      });
    }

    return items;
  }, [entity, mainDocument?.filename]);

  return (
    <TabButtons
      groupId="entity-main"
      buttons={buttons}
      activeTabId={activeTabId}
      onTabChange={onTabChange}
      tabListAriaLabel="Entity primary"
    />
  );
};

export { TabsMainButtons };
