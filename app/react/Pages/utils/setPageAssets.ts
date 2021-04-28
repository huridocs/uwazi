import rison from 'rison-node';

import api from 'app/Search/SearchAPI';
import { actions } from 'app/BasicReducer';
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

const prepareLists = (content: string, requestParams: RequestParams) => {
  const listsData: ListsData = pageItemLists.generate(content);

  listsData.searchs = Promise.all(
    listsData.params.map((params, index) => {
      const sanitizedParams = params ? decodeURI(params) : '';
      const queryDefault = { filters: {}, types: [] };
      let query: Query = queryDefault;

      if (sanitizedParams) {
        query = rison.decode(sanitizedParams.replace('?q=', '') || '()');
        if (typeof query !== 'object') {
          query = queryDefault;
        }
      }

      query.limit = listsData.options[index].limit ? String(listsData.options[index].limit) : '6';
      return api.search(requestParams.set(query));
    })
  );

  return listsData;
};

const setPageAssets = async (requestParams: RequestParams) => {
  const page = await PagesAPI.getById(requestParams);

  const listsData = prepareLists(page.metadata.content, requestParams);
  const dataSets = markdownDatasets.fetch(page.metadata.content, requestParams.onlyHeaders());

  const [pageView, searchParams, searchOptions, datasets, listSearchs] = await Promise.all([
    page,
    listsData.params,
    listsData.options,
    dataSets,
    listsData.searchs,
  ]);

  const itemLists = searchParams.map((p, index) => ({
    params: p,
    items: listSearchs[index].rows,
    options: searchOptions[index],
  }));

  return [
    actions.set('page/pageView', pageView),
    actions.set('page/itemLists', itemLists),
    actions.set('page/datasets', datasets),
  ];
};

export { setPageAssets };
