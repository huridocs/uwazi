import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom, templatesAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { countEntityFiles, countEntityRelationships } from '#V2/formatters/index.js';
import { useDirectedRelationships, useMetadataEditing } from '../../Components/context/index.js';
import { buildEntityTabCatalog } from '../sideTabSets.js';
import type { UseEntityTabsParams } from '../EntityTabsContext.js';

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

  const catalogFor = useCallback(
    (searchDirty: boolean) =>
      buildEntityTabCatalog({
        entity,
        hasMainDocument,
        filesSideTabs,
        metadataDirty,
        searchDirty,
        filesCount,
        relationshipsCount,
      }),
    [entity, filesCount, filesSideTabs, hasMainDocument, metadataDirty, relationshipsCount]
  );
  return { catalogFor };
};

export { useEntitySideButtonModel };
