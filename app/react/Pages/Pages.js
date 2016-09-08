import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import PagesAPI from './PagesAPI';
import {actions} from 'app/BasicReducer';

import PagesList from './components/PagesList';

export class Pages extends RouteHandler {

  static requestState() {
    return PagesAPI.get()
    .then((pages) => {
      return {pages};
    });
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('pages', state.pages));
  }

  render() {
    return <PagesList />;
  }
}

export default Pages;
