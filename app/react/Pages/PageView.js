import React from 'react';
import rison from 'rison';

import { actions } from 'app/BasicReducer';
import { markdownDatasets } from 'app/Markdown';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import RouteHandler from 'app/App/RouteHandler';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import api from 'app/Search/SearchAPI';

import PageViewer from './components/PageViewer';
import PagesAPI from './PagesAPI';
import pageItemLists from './utils/pageItemLists';

function prepareLists(page) {
  const listsData = pageItemLists.generate(page.metadata.content);

  listsData.searchs = Promise.all(listsData.params.map((params, index) => {
    const sanitizedParams = params ? decodeURI(params) : '';
    const queryDefault = { filters: {}, types: [] };
    let query = queryDefault;

    if (sanitizedParams) {
      query = rison.decode(sanitizedParams.replace('?q=', '') || '()');
      if (typeof query !== 'object') {
        query = queryDefault;
      }
    }

    query.limit = listsData.options[index].limit ? String(listsData.options[index].limit) : '6';
    return api.search(query);
  }));

  return listsData;
}

export class PageView extends RouteHandler {
  static requestState({ pageId }) {
    return PagesAPI.get(pageId)
    .then((page) => {
      const listsData = prepareLists(page);
      const dataSets = markdownDatasets.fetch(page.metadata.content);
      return Promise.all([page, listsData.params, listsData.options, dataSets, listsData.searchs]);
    })
    .then(([pageView, searchParams, searchOptions, datasets, listSearchs]) => {
      const itemLists = searchParams.map((params, index) => ({ params, items: listSearchs[index].rows, options: searchOptions[index] }));
      return {
        page: { pageView, itemLists, datasets },
      };
    });
  }

  closeSidePanel() {
    wrapDispatch(this.context.store.dispatch, 'library')(unselectAllDocuments());
  }

  componentDidMount() {
    this.closeSidePanel();
  }

  emptyState() {
    this.closeSidePanel();
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('page/pageView', state.page.pageView));
    this.context.store.dispatch(actions.set('page/itemLists', state.page.itemLists));
    this.context.store.dispatch(actions.set('page/datasets', state.page.datasets));
  }

  render() {
    return (
      <React.Fragment>
        <PageViewer />
        <ViewMetadataPanel storeKey="library" />
        <SelectMultiplePanelContainer storeKey="library"/>
      </React.Fragment>
    );
  }
}

export default PageView;
