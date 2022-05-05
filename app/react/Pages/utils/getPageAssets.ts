import rison from 'rison-node';
import { get, has } from 'lodash';
import api from 'app/Search/SearchAPI';
import { markdownDatasets } from 'app/Markdown';
import { RequestParams } from 'app/utils/RequestParams';
import PagesAPI from '../PagesAPI';
import pageItemLists from './pageItemLists';

type Query = { filters: {}; types: string[]; limit?: string };

interface ListsData {
  params: string[];
  content: string;
  options: { limit?: number }[];
  searchs?: any;
}

const buildQuery = (sanitizedParams: string) => {
  const queryDefault = { filters: {}, types: [] };
  if (sanitizedParams) {
    const query = rison.decode(sanitizedParams.replace('?q=', '') || '()');
    if (typeof query !== 'object') {
      return queryDefault;
    }
    return query;
  }
  return queryDefault;
};

const prepareLists = (content: string, requestParams: RequestParams) => {
  const listsData: ListsData = pageItemLists.generate(content);

  listsData.searchs = Promise.all(
    listsData.params.map((params, index) => {
      const sanitizedParams = params ? decodeURI(params) : '';

      const query: Query = buildQuery(sanitizedParams);

      query.limit = listsData.options[index].limit ? String(listsData.options[index].limit) : '6';
      return api.search(requestParams.set(query));
    })
  );

  return listsData;
};

const replaceDynamicProperties = (pageContent?: string, datasets?: any) => {
  if (!pageContent || !datasets || (!datasets.entityData && !datasets.template)) {
    return pageContent;
  }

  const parsableDatasets = {
    entity: datasets.entityData,
    template: datasets.template,
  };

  return pageContent.replace(/\$\{((entity.|template.)[^}^\s]*)\}/g, (match, p) => {
    switch (true) {
      case /entity.metadata.\w*$/.test(p):
        return get(parsableDatasets, `${p}[0].value`);

      case /entity.metadata.\w*.(value|displayValue)$/.test(p): {
        const path = p.split('.');
        const pathEnd = path.pop();
        return get(parsableDatasets, `${path.join('.')}[0].${pathEnd}`);
      }

      case /entity.metadata.\w*\[\d+]$/.test(p):
        return get(parsableDatasets, `${p}.value`);

      case has(parsableDatasets, p):
        return get(parsableDatasets, p);

      default:
        return match;
    }
  });
};

const getPageAssets = async (
  requestParams: RequestParams,
  additionalDatasets?: {},
  localDatasets?: {}
) => {
  const page = await PagesAPI.getById(requestParams);
  page.metadata.content = replaceDynamicProperties(page.metadata?.content, localDatasets);
  const listsData = prepareLists(page.metadata.content, requestParams);

  const dataSets = markdownDatasets.fetch(page.metadata.content, requestParams.onlyHeaders(), {
    additionalDatasets,
  });

  const [pageView, searchParams, searchOptions, datasets, listSearchs] = await Promise.all([
    page,
    listsData.params,
    listsData.options,
    dataSets,
    listsData.searchs,
  ]);
  pageView.scriptRendered = false;

  const itemLists = searchParams.map((p, index) => ({
    params: p,
    items: listSearchs[index].rows,
    options: searchOptions[index],
  }));

  return {
    pageView,
    itemLists,
    datasets: { ...datasets, ...localDatasets },
  };
};

export { getPageAssets };
