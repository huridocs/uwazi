/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { I18NLink, t } from 'app/I18N';
import api from 'app/Search/SearchAPI';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import { getSuggestionsQuery } from 'app/Settings/utils/suggestions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { Icon } from 'UI';
import { aggregateSuggestionCount } from 'app/Settings/utils/aggregateThesaurusSuggestionCount';

/** Model is the type used for holding information about a classifier model. */
interface ClassifierModel {
  name: string;
  preferred: string;
  bert: string;
  sample: number;
  topics: {
    [key: string]: {
      name: string;
      quality: number;
      samples: number;
    };
  };
}

interface ThesaurusTopic {
  id: string;
  label: string;
  suggestions: number;
}

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
    topic: ThesaurusTopic,
    modelInfo: ClassifierModel,
    propName: string | undefined
  ) {
    if (modelInfo === undefined) {
      return null;
    }
    const { label, id, suggestions } = topic;
    const { quality = 0 } = (modelInfo.topics || {})[label] || {};

    return (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td title="quality-icons">{this.qualityIcon(label, quality)}</td>
        <td title="suggestions-count">{suggestions || null}</td>
        <td title="review-button">
          {suggestions > 0 && propName ? (
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
    const { values: topics, name, property } = this.props.thesaurus; // {name: Themes; values: [{label: Education}, ...]}

    if (!topics) {
      return null;
    }

    const model = this.props.models.find((modelInfo: ClassifierModel) => modelInfo.name === name);
    const propName: string | undefined = (this.props.thesaurus.property || {}).name;
    const { suggestions } = this.props;
    const thesaurusSuggestions: any = [];
    suggestions.forEach((templateResult: any) => {
      if (
        templateResult.aggregations !== undefined &&
        templateResult.aggregations.all.hasOwnProperty(`_${property.name}`)
      ) {
        const { buckets } = templateResult.aggregations.all[`_${property.name}`];
        buckets.forEach((b: any) => thesaurusSuggestions.push(b));
      }
    });
    const dedupedSuggestions = thesaurusSuggestions.reduce((acc: any, obj: any) => {
      const { key } = obj;
      if (!acc[key]) {
        acc[key] = obj.filtered.doc_count;
      } else {
        acc[key] += obj.filtered.doc_count;
      }
      return acc;
    }, {});

    topics.sort(
      // Sort in order of descending number of documents with suggestions
      // TODO: Make sort order configurable, or even better, dynamic
      (topic1: ThesaurusTopic, topic2: ThesaurusTopic) =>
        (dedupedSuggestions[topic2.id] || 0) - (dedupedSuggestions[topic1.id] || 0)
    );

    return topics.map((topic: ThesaurusTopic) => {
      const topicWithSuggestions = { ...topic, suggestions: dedupedSuggestions[topic.id] || 0 };
      return ThesaurusCockpitBase.topicNode(topicWithSuggestions, model, propName);
    });
  }

  static async requestState(requestParams: any) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const [thesauri, templates] = await Promise.all([
      ThesaurisAPI.getThesauri(requestParams),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ model: thesaurus.name });
    const model: ClassifierModel = await ThesaurisAPI.getModelStatus(modelParams);

    // Get aggregate document count of documents with suggestions on this thesaurus
    const assocProp = resolveTemplateProp(thesaurus, templates);
    const allDocsWithSuggestions = await Promise.all(
      templates.map((template: { _id: string }) => {
        const reqParams = requestParams.set(getSuggestionsQuery(assocProp, template._id));
        return api.search(reqParams);
      })
    );
    thesaurus.property = assocProp;

    const templateProps = resolveTemplateProp(thesaurus, templates);

    const propToAgg = templates.map((template: any) => [
      templateProps,
      [template, allDocsWithSuggestions.shift()],
    ]);

    aggregateSuggestionCount([propToAgg], [thesaurus]);

    return [
      actions.set('thesauri/thesaurus', thesaurus),
      actions.set('thesauri/models', [model]),
      actions.set('thesauri/suggestions', allDocsWithSuggestions),
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

  allThesaurusSuggestionsButton() {
    if (
      this.props.thesaurus === undefined ||
      this.props.thesaurus.property === undefined ||
      this.props.thesaurus.suggestions < 1
    ) {
      return null;
    }
    const thesaurusPropertyRefName = this.props.thesaurus.property.name;
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
    const { name } = this.props.thesaurus; // {name: Themes; values: [{label: Education}, ...]}
    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          {t('System', `Thesauri > ${name}`)}
          {this.allThesaurusSuggestionsButton()}
        </div>
        <div className="cockpit">
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">{t('System', 'Confidence')}</th>
                <th scope="col">{t('System', 'Suggestions')}</th>
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

const selectModels = createSelector(
  (state: any) => state.thesauri.models,
  models => models.toJS()
);

const selectThesaurus = createSelector(
  (state: any) => state.thesauri.thesaurus,
  thesaurus => thesaurus.toJS()
);

const selectSuggestions = createSelector(
  (state: any) => state.thesauri.suggestions,
  suggestions => suggestions.toJS()
);

function mapStateToProps(state: any) {
  return {
    models: selectModels(state), // {name: ModelName; bert: bert123; sample: 53}
    thesaurus: selectThesaurus(state), // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
    suggestions: selectSuggestions(state),
  };
}

export default connect(
  mapStateToProps,
  null
  //{ withRef: true }
)(ThesaurusCockpitBase);
