/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { I18NApi } from 'app/I18N';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import UsersAPI from 'app/Users/UsersAPI';
import { RequestParams } from 'app/utils/RequestParams';
import React from 'react';
import Helmet from 'react-helmet';

import SettingsNav from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';

export class Settings extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, thesauri, relationTypes, translations, collection] = await Promise.all([
      UsersAPI.currentUser(request),
      ThesaurisAPI.getThesauri(request),
      RelationTypesAPI.get(request),
      I18NApi.get(request),
      SettingsAPI.get(request),
    ]);

    /** Fetch models associated with known thesauri.  */
    const allModels = await Promise.all(
      thesauri.map(thesaurus =>
        ThesaurisAPI.getModelStatus(new RequestParams({ model: thesaurus.name }))
      )
    );
    const models = allModels.filter(model => !model.hasOwnProperty('error'));

    const modeledThesauri = thesauri.map(thesaurus => {
      const relevantModel = models.find(model => model.name === thesaurus.name);
      if (relevantModel !== undefined) {
        return {
          ...thesaurus,
          model_available: relevantModel.preferred != null,
        };
      }
      return { ...thesaurus, model_available: false };
    });

    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', modeledThesauri),
      actions.set('thesauri/models', models),
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
