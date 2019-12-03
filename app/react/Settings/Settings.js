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

export class Settings extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, thesauri, models, relationTypes, translations, collection] = await Promise.all([
      UsersAPI.currentUser(request),
      ThesaurisAPI.getThesauri(request),
      ThesaurisAPI.getModelStatus(request),
      RelationTypesAPI.get(request),
      I18NApi.get(request),
      SettingsAPI.get(request),
    ]);

    const modeledThesauri = thesauri.map(thesaurus => {
      const thesaurusModelName = buildModelName(thesaurus.name);
      if (models.models.includes(thesaurusModelName)) {
        return { ...thesaurus, model_available: true };
      }
      return { ...thesaurus, model_available: false };
    });

    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', modeledThesauri),
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
