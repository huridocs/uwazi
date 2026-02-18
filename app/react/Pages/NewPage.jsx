import React from 'react';
import { PageCreator } from '#app/Pages/components/PageCreator.js';
import { RouteHandler } from '#app/App/RouteHandler.js';

class NewPage extends RouteHandler {
  render() {
    return (
      <div className="settings-content">
        <PageCreator />
      </div>
    );
  }
}

export { NewPage };
