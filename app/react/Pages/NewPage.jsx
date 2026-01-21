import React from 'react';
import { PageCreator } from '#app/Pages/components/PageCreator.js';
import RouteHandler from '#app/App/RouteHandler.jsx';

export default class NewPage extends RouteHandler {
  render() {
    return (
      <div className="settings-content">
        <PageCreator />
      </div>
    );
  }
}
