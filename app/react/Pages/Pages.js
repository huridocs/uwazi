import React from 'react';

import RouteHandler from '#app/App/RouteHandler.jsx';
import { actions } from '#app/BasicReducer/index.js';
import PagesAPI from '#app/Pages/PagesAPI.js';

import PagesList from '#V2/Routes/Settings/Pages/PagesList.jsx';

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
