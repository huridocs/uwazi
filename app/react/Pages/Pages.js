import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import PagesAPI from './PagesAPI';

import PagesList from './components/PagesList';

export class Pages extends RouteHandler {
  static async requestState(requestParams) {
    const pages = await PagesAPI.get(requestParams);
    return [actions.set('pages', pages)];
  }

  render() {
    return (
      <div className="settings-content">
        <PagesList />
      </div>
    );
  }
}

export default Pages;
