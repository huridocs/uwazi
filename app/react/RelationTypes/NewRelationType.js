import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import TemplateCreator from '../Templates/components/TemplateCreator';

export default class NewRelationType extends RouteHandler {
  render() {
    return (
      <div className="settings-content">
        <TemplateCreator relationType />
      </div>
    );
  }
}
