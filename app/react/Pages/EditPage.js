import React from 'react';
import { actions as formActions } from 'react-redux-form';

import RouteHandler from 'app/App/RouteHandler';

import PageCreator from 'app/Pages/components/PageCreator';
import pagesAPI from './PagesAPI';

export default class EditPage extends RouteHandler {
  static async requestState(requestParams) {
    const [page] = await pagesAPI.get(requestParams);
    return [formActions.load('page.data', page)];
  }

  componentDidMount() {
    this.context.store.dispatch(formActions.reset('page.data'));
  }

  render() {
    return <PageCreator />;
  }
}
