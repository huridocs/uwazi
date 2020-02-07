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

function prepareLists(content, requestParams) {
  const listsData = pageItemLists.generate(content);

  listsData.searchs = Promise.all(
    listsData.params.map((params, index) => {
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
      return api.search(requestParams.set(query));
    })
  );

  return listsData;
}

class PageView extends RouteHandler {
  static async requestState(requestParams) {
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
  }

  closeSidePanel() {
    wrapDispatch(this.context.store.dispatch, 'library')(unselectAllDocuments());
  }

  componentDidMount() {
    this.closeSidePanel();
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.closeSidePanel();
    this.context.store.dispatch(actions.unset('page/pageView'));
    this.context.store.dispatch(actions.unset('page/itemLists'));
    this.context.store.dispatch(actions.unset('page/datasets'));
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
        <SelectMultiplePanelContainer storeKey="library" />
      </React.Fragment>
    );
  }
}

export default PageView;
