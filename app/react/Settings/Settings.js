/** @format */

import React from 'react';
import Helmet from 'react-helmet';

import RouteHandler from 'app/App/RouteHandler';
import UsersAPI from 'app/Users/UsersAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import { buildModelName } from 'shared/commonTopicClassification';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { actions } from 'app/BasicReducer';
import { I18NApi } from 'app/I18N';
import SettingsNav from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';

function modelAvailable(thesaurus, models) {
  console.dir(thesaurus);
  if (models.includes(buildModelName(thesaurus.name))) {
    console.dir(thesaurus.name);
    return { ...thesaurus, model_available: true };
  }
  console.dir('no match', thesaurus.name);
  return { ...thesaurus, model_available: false };
}
export class Settings extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, thesauri, models, relationTypes, translations, collection] = await Promise.all([
      UsersAPI.currentUser(request),
      ThesaurisAPI.getDictionaries(request),
      ThesaurisAPI.getModelStatus(request),
      RelationTypesAPI.get(request),
      I18NApi.get(request),
      SettingsAPI.get(request),
    ]);

    console.dir(models);
    thesauri.map(thesaurus => modelAvailable(thesaurus, models.models));
    console.dir('thesauri filtered');
    console.dir(thesauri);

    // array of actions.update('dictionaries', {thesauri._id: id, model_available: true}) for all models available
    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', thesauri),
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
