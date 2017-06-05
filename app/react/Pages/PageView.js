import React from 'react';
import rison from 'rison';

import RouteHandler from 'app/App/RouteHandler';
import api from 'app/Search/SearchAPI';
import PagesAPI from './PagesAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import {actions} from 'app/BasicReducer';

import PageViewer from './components/PageViewer';
import pageItemLists from './utils/pageItemLists';

function prepareLists(page) {
  const listsData = pageItemLists.generate(page.metadata.content);

  listsData.searchs = listsData.params.map(params => {
    const sanitizedParams = params ? params.replace(/%27/g, '\'') : '';
    let query = sanitizedParams ? rison.decode(sanitizedParams.replace('?q=', '') || '()') : {filters: {}, types: []};
    query.limit = '6';
    return api.search(query);
  });

  return listsData;
}

export class PageView extends RouteHandler {

  static requestState({pageId}) {
    return Promise.all([PagesAPI.get(pageId), TemplatesAPI.get(), ThesaurisAPI.get()])
    .then(([page, templates, thesauris]) => {
      const listsData = prepareLists(page);
      page.metadata.content = listsData.content;

      return Promise.all([page, templates, thesauris, listsData.params].concat(listsData.searchs));
    })
    .then(results => {
      const pageView = results.shift();
      const templates = results.shift();
      const thesauris = results.shift();
      const searchParams = results.shift();
      const itemLists = searchParams.map((params, index) => {
        return {params, items: results[index].rows};
      });

      return {
        page: {pageView, itemLists},
        templates,
        thesauris
      };
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('templates', state.templates));
    this.context.store.dispatch(actions.set('thesauris', state.thesauris));
    this.context.store.dispatch(actions.set('page/pageView', state.page.pageView));
    this.context.store.dispatch(actions.set('page/itemLists', state.page.itemLists));
  }

  render() {
    return <PageViewer />;
  }
}

export default PageView;
