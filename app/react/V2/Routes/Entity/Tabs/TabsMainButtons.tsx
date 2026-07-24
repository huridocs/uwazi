import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { TabButtons } from '#V2/Components/UI/index.js';
import type { Entity as EntityType, FileType } from '#V2/api/entities/types.js';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles, countEntityRelationships } from '#V2/formatters/index.js';
import { useMetadataEditing } from '../Components/context/index.js';
import { EntityLanguageBar, TabLabel } from '../Components/shared/index.js';
import { isMetadataHostDirty } from './metadataTabSession.js';
import { MAIN_TAB } from './tabIds.js';

type TabsMainButtonsProps = {
  entity: EntityType;
  mainDocument?: FileType;
  onTabChange: (tabId: string) => void;
};

const TabsMainButtons = ({ entity, mainDocument, onTabChange }: TabsMainButtonsProps) => {
  const { isDirty, editingHost } = useMetadataEditing();
  const metadataDirty = isMetadataHostDirty(isDirty, editingHost, 'main');
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const buttons = useMemo(() => {
    const items = [];
    const filesCount = countEntityFiles(entity, templates, locale, defaultLanguage);
    const relationshipsCount = countEntityRelationships(entity, mainDocument?._id);

    if (mainDocument?.filename) {
      items.push({
        id: MAIN_TAB.DOCUMENT,
        label: <TabLabel text="Document" />,
      });
    }

    items.push({
      id: MAIN_TAB.METADATA,
      label: <TabLabel text="Metadata" dirty={metadataDirty} />,
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
  }, [
    defaultLanguage,
    entity,
    locale,
    mainDocument?.filename,
    mainDocument?._id,
    metadataDirty,
    templates,
  ]);

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 overflow-x-auto">
        <TabButtons
          groupId="entity-main"
          buttons={buttons}
          onTabChange={onTabChange}
          tabListAriaLabel="Entity primary"
        />
      </div>
      <EntityLanguageBar />
    </div>
  );
};

export { TabsMainButtons };
