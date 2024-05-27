import React from 'react';

import { actions } from 'app/BasicReducer';
import { unselectAllDocuments } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import RouteHandler from 'app/App/RouteHandler';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { withRouter } from 'app/componentWrappers';
import { trackPage } from 'app/App/GoogleAnalytics';
import { ErrorBoundary } from 'app/V2/Components/ErrorHandling';
import { PageViewer } from './components/PageViewer';
import { getPageAssets } from './utils/getPageAssets';

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
