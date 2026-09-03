import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles, countEntityRelationships } from '#V2/formatters/index.js';
import { useDirectedRelationships, useMetadataEditing } from '../../Components/context/index.js';
import { getSideTabButtons } from '../sideTabSets.js';
import type { MainTabId } from '../tabIds.js';
import type { UseEntityTabsParams } from './entityTabsTypes.js';

const useEntitySideButtonModel = ({
  entity,
  hasMainDocument,
  mainDocumentId,
  filesSideTabs,
}: UseEntityTabsParams) => {
  const relationships = useDirectedRelationships();
  const { isDirty: metadataDirty } = useMetadataEditing();
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const relationshipsCount = countEntityRelationships(
    entity.sharedId,
    relationships,
    mainDocumentId
  );
  const filesCount = useMemo(
    () => countEntityFiles(entity, templates, locale, defaultLanguage),
    [defaultLanguage, entity, locale, templates]
  );

  const buttonsFor = useCallback(
    (activeMainTab: MainTabId, searchDirty: boolean) =>
      getSideTabButtons({
        activeMainTab,
        entity,
        hasMainDocument,
        mainDocumentId,
        filesSideTabs,
        metadataDirty,
        searchDirty,
        filesCount,
        relationshipsCount,
      }),
    [
      entity,
      filesCount,
      filesSideTabs,
      hasMainDocument,
      mainDocumentId,
      metadataDirty,
      relationshipsCount,
    ]
  );

  return { metadataDirty, filesCount, relationshipsCount, buttonsFor };
};

export { useEntitySideButtonModel };
