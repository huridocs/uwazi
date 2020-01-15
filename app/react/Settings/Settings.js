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

import SettingsNav from './components/SettingsNavigation';
import SettingsAPI from './SettingsAPI';

/* A given template property may refer to an existing thesaurus to provide multi-select values. This function resolves a template property name that refers to a particular thesaurus. */
function findMatchingTemplateProp(thesaurus, templates) {
  let matchingProp;
  for (let i = 0; i < templates.length; i += 1) {
    const template = templates[i];
    const matchProp = template.properties.find(prop => prop.content === thesaurus._id);
    if (matchProp !== undefined) {
      matchingProp = matchProp;
      // TODO: Consider supporting multiple fields referring to the same thesaurus.
      break;
    }
  }
  return matchingProp;
}
function buildSuggestionsQuery(matchingTemplateProps) {
  const query = {
    select: ['sharedId'],
    limit: 1,
    // add call to get templates to calculate
    // list of all template._id with a property called themes
    // property.id
    filters: {},
    unpublished: true,
    types: ['5d305622ad878e81d220b324'], // this is one template ID
  };
  //[matchingTemplateProps].forEach(t => {
  const { name } = matchingTemplateProps;
  const { content } = matchingTemplateProps;

  const filters = {};
  filters[name] = {
    values: ['missing'],
  };
  filters[`_${name}`] = {
    values: ['any'],
  };
  query.filters = filters;
  return query;
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

    // extract name from matching template property content from templates
    // TODO: decide what to do if two templates used with different field names
    const props = thesauri.map(thesaurus => findMatchingTemplateProp(thesaurus, templates));
    const allDocsWithSuggestions = await Promise.all(
      props.map(p => {
        const reqParams = requestParams.set(buildSuggestionsQuery(p));
        return api.search(reqParams);
      })
    );

    const propToAgg = props.map((p, i) => [p, allDocsWithSuggestions[i]]);

    // documents.aggregations.all.body.buckets is len 53
    // template keys are thesaurus id
    propToAgg.forEach(tuple => {
      const prop = tuple[0];
      const results = tuple[1];
      const { buckets } = results.aggregations.all[`_${prop.name}`];
      console.dir(`${prop.name} (${prop.content}):`);
      let soFar = 0;
      buckets.forEach(bucket => {
        console.dir(`  ${bucket.key}: ${bucket.filtered.doc_count}`);
        soFar += bucket.filtered.doc_count;
      });
      console.dir(`Total: ${soFar}`);
      console.dir('                  ');
    });
    // Fetch models associated with known thesauri.
    const allModels = await Promise.all(
      thesauri.map(thesaurus => ThesaurisAPI.getModelStatus(request.set({ model: thesaurus.name })))
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
