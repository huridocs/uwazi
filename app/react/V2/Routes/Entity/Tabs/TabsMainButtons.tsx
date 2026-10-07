import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate, t } from '#app/I18N/index.js';
import { TabButtons } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles, countEntityRelationships } from '#V2/formatters/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import {
  useEntityPageView,
  useMetadataEditing,
  useDirectedRelationships,
} from '../Components/context/index.js';
import { EntityLanguageBar, TabLabel } from '../Components/shared/index.js';
import { MAIN_TAB } from './tabIds.js';

type TabsMainButtonsProps = {
  entity: EntityType;
  mainDocument?: FileType;
  onTabChange: (tabId: string) => void;
  groupId?: string;
};

const TabsMainButtons = ({
  entity,
  mainDocument,
  onTabChange,
  groupId = 'entity-main',
}: TabsMainButtonsProps) => {
  const { isDirty } = useMetadataEditing();
  const { hasEntityPageView } = useEntityPageView();
  const reserveToggleSlot = useIsMobile() === true && hasEntityPageView;
  const relationships = useDirectedRelationships();
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const buttons = useMemo(() => {
    const items = [];
    const filesCount = countEntityFiles(entity, templates, locale, defaultLanguage);
    const relationshipsCount = countEntityRelationships(
      entity.sharedId,
      relationships,
      mainDocument?._id
    );

    if (mainDocument?.filename) {
      items.push({
        id: MAIN_TAB.DOCUMENT,
        name: 'Document',
        label: <TabLabel text="Document" />,
      });
    }

    items.push({
      id: MAIN_TAB.METADATA,
      name: 'Metadata',
      label: <TabLabel text="Metadata" dirty={isDirty} />,
    });

    items.push({
      id: MAIN_TAB.RELATIONSHIPS,
      name: 'Relationships',
      label: <TabLabel text="Relationships" count={relationshipsCount} />,
      menuLabel: <Translate>Relationships</Translate>,
      accessory: relationshipsCount,
    });

    items.push({
      id: MAIN_TAB.FILES,
      name: 'Files',
      label: <TabLabel text="Files" count={filesCount} />,
      menuLabel: <Translate>Files</Translate>,
      accessory: filesCount,
    });

    return items;
  }, [
    defaultLanguage,
    entity,
    relationships,
    isDirty,
    locale,
    mainDocument?.filename,
    mainDocument?._id,
    templates,
  ]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <TabButtons
          groupId={groupId}
          buttons={buttons}
          onTabChange={onTabChange}
          tabListAriaLabel={t('System', 'Entity primary', null, false)}
        />
      </div>
      {reserveToggleSlot ? (
        <div className="me-10 shrink-0">
          <EntityLanguageBar />
        </div>
      ) : (
        <EntityLanguageBar />
      )}
    </div>
  );
};

export { TabsMainButtons };
