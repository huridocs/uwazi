/** @format */

import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { I18NLink, t } from 'app/I18N';
import api from 'app/Search/SearchAPI';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import { getSuggestionsQuery } from 'app/Settings/utils/suggestions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import { RequestParams } from 'app/utils/RequestParams';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { Icon } from 'UI';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { buildSuggestionResult, flattenSuggestionResults } from './utils/suggestionQuery';
import { ClassifierModelSchema } from './types/classifierModelType';
import { SuggestionResultSchema } from './types/suggestionResultType';

export type ThesaurusCockpitProps = {
  thesaurus: ThesaurusSchema;
  models: Array<ClassifierModelSchema>;
  suggestions: SuggestionResultSchema;
};

export class ThesaurusCockpitBase extends RouteHandler {
  static genIcons(label: string, actual: number, possible: number) {
    const icons = [];
    for (let i = 0; i < possible; i += 1) {
      let iconClass: any;
      if (i < actual) {
        iconClass = 'circle';
      } else {
        iconClass = ['far', 'circle'];
      }
      icons.push(<Icon key={`${label}_${i}`} icon={iconClass} />);
    }
    return icons;
  }

  static qualityIcon(label: string, val: number) {
    switch (true) {
      case val > 0.85:
        return (
          <div key={label} className="quality-icon quality-high">
            {ThesaurusCockpitBase.genIcons(label, 3, 3)}
          </div>
        );
      case val > 0.7:
        return (
          <div key={label} className="quality-icon quality-med">
            {ThesaurusCockpitBase.genIcons(label, 2, 3)}
          </div>
        );
      default:
        return (
          <div key={label} className="quality-icon quality-low">
            {ThesaurusCockpitBase.genIcons(label, 1, 3)}
          </div>
        );
    }
  }

  static topicNode(
    topic: ThesaurusValueSchema,
    suggestionResult: SuggestionResultSchema,
    modelInfo: ClassifierModelSchema,
    propName: string | undefined
  ) {
    if (modelInfo === undefined) {
      return null;
    }
    const { label, id } = topic;
    const { quality = 0 } = (modelInfo.topics || {})[label] || {};
    const suggestionCount = suggestionResult.thesaurus.values[`${id}`] || 0;

    return (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td title="quality-icons">{this.qualityIcon(label, quality)}</td>
        <td title="suggestions-count">{suggestionCount || null}</td>
        <td title="review-button">
          {suggestionCount > 0 && propName ? (
            <I18NLink
              to={`/review?q=(filters:(_${propName}:(values:!('${id}')),${propName}:(values:!(missing))))&includeUnpublished=1`}
              className="btn btn-default btn-xs"
            >
              <Icon icon="gavel" />
              &nbsp;
              <span title="review-button-title">{t('system', 'Review suggestions')}</span>
            </I18NLink>
          ) : null}
        </td>
      </tr>
    );
  }

  topicNodes() {
    const { suggestions, thesaurus, models } = this.props as ThesaurusCockpitProps;
    const { values, name, property } = thesaurus;
    const model = models.find((modelInfo: ClassifierModelSchema) => modelInfo.name === name);

    if (!values || !model || !property) {
      return null;
    }

    return values.map((topic: ThesaurusValueSchema) =>
      ThesaurusCockpitBase.topicNode(topic, suggestions, model, property.name)
    );
  }

  static async requestState(requestParams: RequestParams) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const [thesauri, templates] = await Promise.all([
      ThesaurisAPI.getThesauri(requestParams),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ model: thesaurus.name });
    const model: ClassifierModelSchema = await ThesaurisAPI.getModelStatus(modelParams);

    // Get aggregate document count of documents with suggestions on this thesaurus
    const assocProp = resolveTemplateProp(thesaurus, templates);
    thesaurus.property = assocProp;

    const allDocsWithSuggestions = await Promise.all(
      templates.map((template: { _id: string }) => {
        const reqParams = requestParams.set(getSuggestionsQuery(assocProp, template._id));
        return api.search(reqParams);
      })
    );
    const sanitizedSuggestions = allDocsWithSuggestions.map((s: any) =>
      buildSuggestionResult(s, assocProp.name)
    );
    const flattenedSuggestions = flattenSuggestionResults(sanitizedSuggestions, assocProp.name);
    return [
      actions.set('thesauri/thesaurus', thesaurus as ThesaurusSchema),
      actions.set('thesauri/models', [model]),
      actions.set('thesauri/suggestions', flattenedSuggestions),
    ];
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('thesauri/models'));
    this.context.store.dispatch(actions.unset('thesauri/thesaurus'));
    this.context.store.dispatch(actions.unset('thesauri/suggestions'));
  }

  suggestionsButton() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;

    if (!thesaurus || !thesaurus.property) {
      return null;
    }
    const thesaurusPropertyRefName = thesaurus.property.name;

    return (
      <I18NLink
        to={
          `/uploads/?q=(filters:(_${thesaurusPropertyRefName}:(values:!(any)),${thesaurusPropertyRefName}:(values:!(any))),` +
          'limit:100,order:desc,sort:creationDate)&view=nosearch'
        }
        className="btn btn-primary btn-xs"
      >
        <Icon icon="search" />
        &nbsp;
        <span>{t('System', 'Review & Publish')}</span>
      </I18NLink>
    );
  }

  render() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;
    const { name } = thesaurus;
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          {t('System', `Thesauri > ${name}`)}
          {this.suggestionsButton()}
        </div>
        <div className="cockpit">
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">{t('System', 'Confidence')}</th>
                <th scope="col">{t('System', 'Documents to be reviewed')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>{this.topicNodes()}</tbody>
          </table>
        </div>
        <div className="settings-footer">
          <I18NLink to="/settings/dictionaries" className="btn btn-default">
            <Icon icon="arrow-left" />
            <span className="btn-label">{t('System', 'Back')}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

interface ThesaurusCockpitStore {
  thesauri: {
    thesaurus: IImmutable<ThesaurusSchema>;
    models: Array<IImmutable<ClassifierModelSchema>>;
    suggestions: IImmutable<SuggestionResultSchema>;
  };
}

const selectModels = createSelector(
  (state: ThesaurusCockpitStore) => state.thesauri.models,
  models => models.map(m => m.toJS())
);

const selectThesaurus = createSelector(
  (state: ThesaurusCockpitStore) => state.thesauri.thesaurus,
  thesaurus => thesaurus.toJS()
);

const selectSuggestions = createSelector(
  (state: ThesaurusCockpitStore) => state.thesauri.suggestions,
  suggestions => suggestions.toJS()
);

function mapStateToProps(state: ThesaurusCockpitStore) {
  return {
    models: selectModels(state),
    thesaurus: selectThesaurus(state),
    suggestions: selectSuggestions(state),
  };
}

export default connect(
  mapStateToProps,
  null
  //{ withRef: true }
)(ThesaurusCockpitBase);
