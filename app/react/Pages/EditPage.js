import React from 'react';
import {actions as formActions} from 'react-redux-form';

import RouteHandler from 'app/App/RouteHandler';

import pagesAPI from './PagesAPI';
import PageCreator from 'app/Pages/components/PageCreator';

export default class EditPage extends RouteHandler {

  static requestState({pageId}) {
    return pagesAPI.get(pageId)
    .then(page => {
      return {
        page: {data: page}
      };
    });
  }

  componentDidMount() {
    this.context.store.dispatch(formActions.reset('page.data'));
  }

  setReduxState({page}) {
    this.context.store.dispatch(formActions.load('page.data', page.data));
  }

  render() {
    return <PageCreator />;
  }
}
