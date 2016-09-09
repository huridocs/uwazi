import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import PagesAPI from './PagesAPI';
import {actions} from 'app/BasicReducer';

import PageViewer from './components/PageViewer';

export class PageView extends RouteHandler {

  static requestState({pageId}) {
    return PagesAPI.get(pageId)
    .then((pages) => {
      console.log('REQ:', pages);
      return {page: {pageView: pages[0]}};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('page/pageView', state.page.pageView));
  }

  render() {
    return <PageViewer />;
  }
}

export default PageView;
