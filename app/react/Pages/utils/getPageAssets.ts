import rison from 'rison-node';
import { get, has } from 'lodash';
import api from 'app/Search/SearchAPI';
import { markdownDatasets } from 'app/Markdown';
import { RequestParams } from 'app/utils/RequestParams';
import PagesAPI from '../PagesAPI';
import pageItemLists from './pageItemLists';

type Query = { filters: {}; types: string[]; limit?: string };

type localDatasets = {
  entityData?: {};
  entity?: {};
  entityRaw?: {};
  template?: {};
};

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

const replaceForTemplate = (pageContent: string, dataset: localDatasets, regex: RegExp) =>
  pageContent.replace(regex, (match, p) => {
    if (has(dataset, p)) {
      return get(dataset, p);
    }
    return match;
  });

const replaceForEntity = (pageContent: string, dataset: localDatasets, regex: RegExp) =>
  pageContent.replace(regex, (match, p) => {
    if (!p.startsWith('entity.metadata.') && has(dataset, p)) {
      return get(dataset, p);
    }
    return match;
  });

const replaceDynamicProperties = (pageContent?: string, localDatasets?: localDatasets) => {
  let result = pageContent;
  const parsableDatasets = {
    entity: localDatasets?.entityData,
    template: localDatasets?.template,
  };

  if (!result || (!parsableDatasets.entity && !parsableDatasets.template)) {
    return result;
  }

  if (result.match(/\$\{((template.)[^}^\s]*)\}/g)) {
    result = replaceForTemplate(result, parsableDatasets, /\$\{((template.)[^}^\s]*)\}/g);
  }

  if (result.match(/\$\{((entity.)[^}^\s]*)\}/g)) {
    result = replaceForEntity(result, parsableDatasets, /\$\{((entity.)[^}^\s]*)\}/g);
  }

  return result;
};

const getPageAssets = async (
  requestParams: RequestParams,
  additionalDatasets?: {},
  localDatasets?: localDatasets
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
