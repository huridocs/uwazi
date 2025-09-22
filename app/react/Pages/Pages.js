import React from 'react';

import RouteHandler from '../../App/RouteHandler.js';
import { actions } from '../../BasicReducer/index.js';
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
