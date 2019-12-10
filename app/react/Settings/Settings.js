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
import { buildModelName } from 'shared/commonTopicClassification';

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

    console.dir(Object.getOwnPropertyNames(models));
    const modelsByThesaurus = {};
    const modeledThesauri = thesauri.map(thesaurus => {
      const thesaurusModelName = buildModelName(thesaurus.name);
      if (models != null && models.hasOwnProperty(thesaurusModelName)) {
        /*const modelInfo = await ThesaurisAPI.getModelStatus(
          new RequestParams({ model: thesaurusModelName })
        );
        console.log(modelInfo);*/
        modelsByThesaurus[thesaurus.name] = models[thesaurusModelName];
        return {
          ...thesaurus,
          model_available: models[thesaurusModelName].preferred != null,
        };
      }
      return { ...thesaurus, model_available: false };
    });
    console.dir('modelsByThesaurus', modelsByThesaurus);

    return [
      actions.set('auth/user', user),
      actions.set('dictionaries', modeledThesauri),
      actions.set('thesauri/models', modelsByThesaurus),
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
