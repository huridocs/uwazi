import React from 'react';
import rison from 'rison';

import RouteHandler from 'app/App/RouteHandler';
import api from 'app/Search/SearchAPI';
import PagesAPI from './PagesAPI';
import {actions} from 'app/BasicReducer';

import PageViewer from './components/PageViewer';
import pageItemLists from './utils/pageItemLists';

function prepareLists(page) {
  const listsData = pageItemLists.generate(page.metadata.content);

  listsData.searchs = listsData.params.map((params, index) => {
    const sanitizedParams = params ? decodeURI(params) : '';
    const queryDefault = {filters: {}, types: []};
    let query = queryDefault;

    if (sanitizedParams) {
      query = rison.decode(sanitizedParams.replace('?q=', '') || '()');
      if (typeof query !== 'object') {
        query = queryDefault;
      }
    }

    query.limit = listsData.options[index].limit ? String(listsData.options[index].limit) : '6';
    return api.search(query);
  });

  return listsData;
}

export class PageView extends RouteHandler {

  static requestState({pageId}) {
    return PagesAPI.get(pageId)
    .then(page => {
      const listsData = prepareLists(page);
      return Promise.all([page, listsData.params, listsData.options].concat(listsData.searchs));
    })
    .then(results => {
      const pageView = results.shift();
      const searchParams = results.shift();
      const searchOptions = results.shift();
      const itemLists = searchParams.map((params, index) => {
        return {params, items: results[index].rows, options: searchOptions[index]};
      });

      return {
        page: {pageView, itemLists}
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('page/pageView', state.page.pageView));
    this.context.store.dispatch(actions.set('page/itemLists', state.page.itemLists));
  }

  render() {
    return <PageViewer />;
  }
}

export default PageView;
