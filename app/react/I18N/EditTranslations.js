import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import EditTranslationForm from 'app/I18N/components/EditTranslationForm';
import {actions} from 'app/I18N/';
import {I18NApi} from 'app/I18N';

export default class EditTranslations extends RouteHandler {

  static requestState() {
    return I18NApi.get()
    .then((translations) => {
      return {translations};
    });
  }

  setReduxState({translations}) {
    this.context.store.dispatch(actions.editTranslations(translations));
  }

  render() {
    return <EditTranslationForm context={this.props.params.context} />;
  }
}
