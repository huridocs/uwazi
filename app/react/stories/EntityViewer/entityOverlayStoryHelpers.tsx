import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import { localeAtom } from '#V2/atoms/index.js';
import {
  useEntityOverlay,
  useEntityRelationshipMarkers,
} from '#V2/Routes/Entity/Components/context/index.js';
import { entityLoaderCache } from '#V2/Routes/Entity/EntityLoaderCache.js';

const SeedOverlayEntityCache = ({ entity }: { entity: Entity }) => {
  const locale = useAtomValue(localeAtom);

  useEffect(() => {
    entityLoaderCache.setEntity(entity.sharedId, locale, entity);
  }, [entity, locale]);

  return null;
};

const OpenEntityOverlayOnMount = ({ targetSharedId }: { targetSharedId: string }) => {
  const { openEntityOverlay } = useEntityOverlay();
  const markers = useEntityRelationshipMarkers();

  useEffect(() => {
    const marker = markers.find(item => item.target.sharedId === targetSharedId);
    if (marker) {
      openEntityOverlay(marker);
    }
  }, [markers, openEntityOverlay, targetSharedId]);

  return null;
};

export { SeedOverlayEntityCache, OpenEntityOverlayOnMount };
