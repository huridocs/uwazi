/* eslint-disable react/no-multi-comp */
import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { localeAtom } from '#V2/atoms/index.js';
import { useEntityOverlayActions } from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityRelationshipMarkers } from '#V2/Routes/Entity/Components/relationships/hooks/useDocumentRelationships.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';

const SeedOverlayEntityCache = ({ entity }: { entity: Entity }) => {
  const locale = useAtomValue(localeAtom);

  useEffect(() => {
    entityLoaderCache.setEntity(entity.sharedId, locale, entity);
  }, [entity, locale]);

  return null;
};

const OpenEntityOverlayOnMount = ({ targetSharedId }: { targetSharedId: string }) => {
  const { openEntityOverlay } = useEntityOverlayActions();
  const markers = useEntityRelationshipMarkers();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    const marker = markers.find(item => item.target.sharedId === targetSharedId);
    if (marker) {
      opened.current = true;
      openEntityOverlay(marker);
    }
  }, [markers, openEntityOverlay, targetSharedId]);

  return null;
};

export { SeedOverlayEntityCache, OpenEntityOverlayOnMount };
