import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { EditTranslationsForm } from 'app/I18N/components/EditTranslationsForm';
import { actions } from 'app/I18N/';
import { I18NApi } from 'app/I18N';

export default class EditTranslations extends RouteHandler {
  static async requestState(requestParams) {
    const translations = await I18NApi.get(requestParams);
    return [actions.editTranslations(translations)];
  }

  render() {
    return (
      <div className="settings-content">
        <EditTranslationsForm context={this.props.params.context} />
      </div>
    );
  }
}
