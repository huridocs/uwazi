import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import EditTranslationForm from 'app/I18N/components/EditTranslationForm';
import { actions } from 'app/I18N/';
import { I18NApi } from 'app/I18N';

export default class EditTranslations extends RouteHandler {
  static async requestState(requestParams) {
    const translations = await I18NApi.get(requestParams);
    return [actions.editTranslations(translations)];
  }

  render() {
    return <EditTranslationForm context={this.props.params.context} />;
  }
}
