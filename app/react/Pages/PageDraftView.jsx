import React from 'react';
import { isClient } from '#app/utils/index.js';
import { actions } from '#app/BasicReducer/index.js';
import { unselectAllDocuments } from '#app/Library/actions/libraryActions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { ViewMetadataPanel } from '#app/Library/components/ViewMetadataPanel.js';
import { SelectMultiplePanelContainer } from '#app/Library/containers/SelectMultiplePanelContainer.js';
import { withRouter } from '#app/componentWrappers.js';
import { trackPage } from '#app/App/GoogleAnalytics.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/ErrorBoundary.js';
import { PageViewer } from './components/PageViewer.js';
import { getPageAssets } from './utils/getPageAssets.js';
import { updatePageDatasets } from './utils/updatePageDatasets.js';
import { openEntitySidePanel } from './utils/openEntitySidePanel.js';

class PageDraftViewComponent extends RouteHandler {
  static async requestState(requestParams) {
    try {
      const { pageView, itemLists, datasets } = await getPageAssets(
        requestParams,
        undefined,
        undefined,
        { contentMode: 'draft' }
      );
      return [
        actions.set('page/pageView', pageView),
        actions.set('page/itemLists', itemLists),
        actions.set('page/datasets', datasets),
      ];
    } catch (e) {
      return [actions.set('page/error', e)];
    }
  }

  closeSidePanel() {
    wrapDispatch(this.context.store.dispatch, 'library')(unselectAllDocuments());
  }

  componentDidMount() {
    this.closeSidePanel();
    if (isClient) {
      window.updatePageDatasets = updatePageDatasets;
      window.openEntitySidePanel = openEntitySidePanel;
    }
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.closeSidePanel();
    this.context.store.dispatch(actions.unset('page/pageView'));
    this.context.store.dispatch(actions.unset('page/itemLists'));
    this.context.store.dispatch(actions.unset('page/datasets'));
    this.context.store.dispatch(actions.unset('page/error'));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('page/pageView', state.page.pageView));
    this.context.store.dispatch(actions.set('page/itemLists', state.page.itemLists));
    this.context.store.dispatch(actions.set('page/datasets', state.page.datasets));
    this.context.store.dispatch(actions.set('page/error', state.page.error));
  }

  render() {
    trackPage();
    return (
      <ErrorBoundary>
        <PageViewer />
        <ViewMetadataPanel storeKey="library" />
        <SelectMultiplePanelContainer storeKey="library" />
      </ErrorBoundary>
    );
  }
}

const SSRPageDraftView = withRouter(PageDraftViewComponent);
const PageDraftViewView = PageDraftViewComponent;

export const PageDraftView = Object.assign(SSRPageDraftView, {
  requestState: PageDraftViewComponent.requestState,
});
export { PageDraftViewView };
