import React from 'react';
import PropTypes from 'prop-types';
import { actions } from '#app/BasicReducer/index.js';
import { RouteHandler } from '#app/App/RouteHandler.js';
import { withRouter } from '#app/componentWrappers.js';
import { ENTITY_VIEW_EMBED_ERROR, findForbiddenPageEmbedTag } from '#shared/embed/pageEmbedConstraints.js';
import { PageViewer } from './components/PageViewer.js';
import { getPageAssets } from './utils/getPageAssets.js';
import { PagesAPI } from './PagesAPI.js';

class PageEmbedViewComponent extends RouteHandler {
  static async requestState(requestParams) {
    try {
      const rawPage = await PagesAPI.getById(requestParams);
      if (rawPage.entityView) {
        return [actions.set('page/error', new Error(ENTITY_VIEW_EMBED_ERROR))];
      }

      const { pageView, itemLists, datasets } = await getPageAssets(
        requestParams,
        {},
        {},
        { contentMode: 'published' }
      );

      const forbiddenTag = findForbiddenPageEmbedTag(pageView.metadata?.content ?? '');
      if (forbiddenTag) {
        return [
          actions.set(
            'page/error',
            new Error(`Pages containing <${forbiddenTag}> cannot be embedded.`)
          ),
        ];
      }

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
