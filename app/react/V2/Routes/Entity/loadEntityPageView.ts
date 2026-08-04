import Immutable from 'immutable';
import type { IncomingHttpHeaders } from 'http';
import { getStore } from '#shared/atomStore/index.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { getPageAssets } from '#app/Pages/utils/getPageAssets.js';
import { prepareAssets } from '#app/Viewer/pageAssets.js';
import { templatesAtom, thesauriAtom, relationshipTypesAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { EntityPageViewData } from './Components/EntityPageView/types.js';

const loadEntityPageView = async (
  entity: Entity,
  headers?: IncomingHttpHeaders
): Promise<EntityPageViewData | undefined> => {
  const atomStore = getStore();
  const templates = atomStore.get(templatesAtom);
  const template = templates.find(item => item._id === entity.template);
  const pageSharedId = template?.entityViewPage?.trim();

  if (!pageSharedId) {
    return undefined;
  }

  const thesauri = atomStore.get(thesauriAtom);
  const relationTypes = atomStore.get(relationshipTypesAtom);
  const immutableTemplates = Immutable.fromJS(templates);
  const immutableThesauri = Immutable.fromJS(thesauri);
  const entityTemplate = immutableTemplates.find(
    (item: { get: (key: string) => unknown } | undefined) => item?.get('_id') === entity.template
  );

  if (!entityTemplate) {
    return undefined;
  }

  try {
    const assets = prepareAssets(
      entity,
      entityTemplate,
      { templates: immutableTemplates, thesauris: immutableThesauri },
      relationTypes
    );

    const { pageView, itemLists, datasets, errors } = await getPageAssets(
      new RequestParams({ sharedId: pageSharedId }, headers),
      undefined,
      assets
    );

    return {
      pageSharedId,
      pageView,
      itemLists: itemLists || [],
      datasets: datasets || {},
      errors,
      entityRaw: entity,
    };
  } catch {
    return {
      pageSharedId,
      pageView: {
        title: '',
        sharedId: pageSharedId,
        metadata: { content: '', script: '', css: '' },
      },
      itemLists: [],
      datasets: {},
      errors: 'Failed to load entity view page',
      entityRaw: entity,
    };
  }
};

export { loadEntityPageView };
