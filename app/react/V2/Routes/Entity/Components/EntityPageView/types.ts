import type { Entity } from '#V2/api/entities/types.js';

type EntityPageViewItemList = {
  params?: string;
  items?: unknown[];
  options?: { limit?: number };
};

/**
 * Payload returned by the entity loader when the template defines entityViewPage.
 * Mirrors V1 page/pageView + datasets, as plain objects (no Redux / Immutable).
 */
type EntityPageViewData = {
  pageSharedId: string;
  pageView: {
    title?: string;
    sharedId?: string;
    markdownSupport?: boolean;
    scriptRendered?: boolean;
    metadata?: {
      content?: string;
      script?: string;
      css?: string;
    };
    [key: string]: unknown;
  };
  itemLists: EntityPageViewItemList[];
  datasets: Record<string, unknown>;
  errors?: string;
  entityRaw: Entity;
};

export type { EntityPageViewData, EntityPageViewItemList };
