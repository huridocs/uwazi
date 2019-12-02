/** @format */

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

async function promiseTimeout(ms, promise) {
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Timed out waiting for ${ms}ms.`));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

export class Settings extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    console.dir('settings requeststate');
    const [user, dictionaries, models, relationTypes, translations, collection] = await Promise.all(
      [
        UsersAPI.currentUser(request),
        ThesaurisAPI.getDictionaries(request),
        ThesaurisAPI.getModelStatus(request),
        RelationTypesAPI.get(request),
        I18NApi.get(request),
        SettingsAPI.get(request),
      ]
    );

    console.dir(models);

    // array of actions.update('dictionaries', {thesauri._id: id, model_available: true}) for all models available
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
          <SettingsNav />
        </div>
        <div className="settings-content">{this.props.children}</div>
      </div>
    );
  }
}

export default Settings;
