import React from 'react';
import { PageCreator } from '../../Pages/components/PageCreator.js';
import RouteHandler from '../../App/RouteHandler.js';

export default class NewPage extends RouteHandler {
  render() {
    return (
      <div className="settings-content">
        <PageCreator />
      </div>
    );
  }
}
