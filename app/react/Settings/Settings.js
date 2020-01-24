/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { I18NApi } from 'app/I18N';
import RelationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import UsersAPI from 'app/Users/UsersAPI';
import React from 'react';
import Helmet from 'react-helmet';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import { getSuggestionsQuery } from 'app/Settings/utils/suggestions';

import SettingsNav from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';
import { aggregateSuggestionCount } from './utils/aggregateThesaurusSuggestionCount';

function findModeledThesauri(thesauri, models) {
  return thesauri.map(thesaurus => {
    const relevantModel = models.find(model => model.name === thesaurus.name);
    if (relevantModel !== undefined) {
      return {
        ...thesaurus,
        model_available: relevantModel.preferred != null,
      };
    }
    return { ...thesaurus, model_available: false };
  });
}

export class Settings extends RouteHandler {
  static async requestState(requestParams) {
    const request = requestParams.onlyHeaders();
    const [user, thesauri, relationTypes, translations, collection, templates] = await Promise.all([
      UsersAPI.currentUser(request),
      ThesaurisAPI.getThesauri(request),
      RelationTypesAPI.get(request),
      I18NApi.get(request),
      SettingsAPI.get(request),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);

    // Fetch models associated with known thesauri.
    const allModels = await Promise.all(
      thesauri.map(thesaurus => ThesaurisAPI.getModelStatus(request.set({ model: thesaurus.name })))
    );
    const models = allModels.filter(model => !model.hasOwnProperty('error'));

    const modeledThesauri = findModeledThesauri(thesauri, models);

    // This builds and queries elasticsearch for suggestion counts per thesaurus
    const templateProps = modeledThesauri
      .filter(t => t.enable_classification)
      .map(thesaurus => resolveTemplateProp(thesaurus, templates));
    const allDocsWithSuggestions = await Promise.all(
      [].concat(
        ...templateProps.map(p =>
          templates.map(t => {
            const reqParams = requestParams.set(getSuggestionsQuery(p, t._id));
            return api.search(reqParams);
          })
        )
      )
    );

    // This processes the search results per thesaurus and stores the aggregate  number of documents to review
    const propToAgg = templateProps.map(p =>
      templates.map(t => [p, [t, allDocsWithSuggestions.shift()]])
    );

    aggregateSuggestionCount(propToAgg, modeledThesauri);

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
