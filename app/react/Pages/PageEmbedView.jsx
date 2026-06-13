import React from 'react';
import PropTypes from 'prop-types';
import { actions } from '#app/BasicReducer/index.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { withRouter } from '#app/componentWrappers.js';
import { PageViewer } from './components/PageViewer.js';
import { getPageAssets } from './utils/getPageAssets.js';

class PageEmbedViewComponent extends RouteHandler {
  static async requestState(requestParams) {
    try {
      const { pageView, itemLists, datasets } = await getPageAssets(
        requestParams,
        {},
        {},
        { contentMode: 'published' }
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

  componentWillUnmount() {
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
    return <PageViewer chromeless setBrowserTitle={false} />;
  }
}

PageEmbedViewComponent.propTypes = {
  params: PropTypes.shape({
    sharedId: PropTypes.string,
  }),
};

const SSRPageEmbedView = withRouter(PageEmbedViewComponent);

const PageEmbedView = Object.assign(SSRPageEmbedView, {
  requestState: PageEmbedViewComponent.requestState,
});

export { PageEmbedView };
