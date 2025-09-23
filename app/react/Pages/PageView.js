import React from 'react';
import { isClient } from '../../api/utils/index.js';
import { actions } from '../../BasicReducer/index.js';
import { unselectAllDocuments } from '../../Library/actions/libraryActions.js';
import { wrapDispatch } from '../../Multireducer.js';
import RouteHandler from '../../App/RouteHandler.js';
import ViewMetadataPanel from '../../Library/components/ViewMetadataPanel.js';
import SelectMultiplePanelContainer from '../../Library/containers/SelectMultiplePanelContainer.js';
import { withRouter } from '../../componentWrappers.js';
import { trackPage } from '../../App/GoogleAnalytics.js';
import { ErrorBoundary } from '../../V2/Components/ErrorHandling.js';
import { PageViewer } from './components/PageViewer.js';
import { getPageAssets } from './utils/getPageAssets.js';
import { updatePageDatasets } from './utils/updatePageDatasets.js';

class PageViewComponent extends RouteHandler {
  static async requestState(requestParams) {
    try {
      const { pageView, itemLists, datasets } = await getPageAssets(requestParams);
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

const SSRPageView = withRouter(PageViewComponent);

export const PageView = Object.assign(SSRPageView, {
  requestState: PageViewComponent.requestState,
});

export default PageViewComponent;
