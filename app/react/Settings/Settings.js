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
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, dictionaries, relationTypes, translations, collection] =
    await Promise.all([
      UsersAPI.currentUser(request),
      ThesaurisAPI.getDictionaries(request),
      RelationTypesAPI.get(request),
      I18NApi.get(request),
      SettingsAPI.get(request)
    ]);

    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', dictionaries),
      actions.set('relationTypes', relationTypes),
      actions.set('translations', translations),
      actions.set('settings/collection', collection),
    ];
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
