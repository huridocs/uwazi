import React from 'react';
import Helmet from 'react-helmet';

import RouteHandler from 'app/App/RouteHandler';
import UsersAPI from 'app/Users/UsersAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { actions } from 'app/BasicReducer';
import { I18NApi } from 'app/I18N';
import SettingsNav from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';

export class Settings extends RouteHandler {
  static requestState() {
    return Promise.all([
      UsersAPI.currentUser(),
      ThesaurisAPI.getDictionaries(),
      RelationTypesAPI.get(),
      I18NApi.get(),
      SettingsAPI.get()
    ])
    .then(([user, dictionaries, relationTypes, translations, collection]) => (
      { user, dictionaries, relationTypes, translations, settings: { collection } }
    ));
  }

  setReduxState(state) {
    this.context.store.dispatch(actions.set('auth/user', state.user));
    this.context.store.dispatch(actions.set('dictionaries', state.dictionaries));
    this.context.store.dispatch(actions.set('relationTypes', state.relationTypes));
    this.context.store.dispatch(actions.set('translations', state.translations));
    this.context.store.dispatch(actions.set('settings/collection', state.settings.collection));
  }

  render() {
    return (
      <div className="row settings">
        <Helmet title="Settings" />
        <div className="settings-navigation">
          <SettingsNav/>
        </div>
        <div className="settings-content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Settings;
