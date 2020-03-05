/* eslint-disable max-lines */
import Footer from 'app/App/Footer';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import { I18NLink, t } from 'app/I18N';
import api from 'app/Search/SearchAPI';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import {
  getReadyToReviewSuggestionsQuery,
  getReadyToPublishSuggestionsQuery,
} from 'app/Settings/utils/suggestions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import { PropertySchema } from 'shared/types/commonTypes';
import { Notice } from 'app/Thesauri/Notice';
import { ClassifierModelSchema } from './types/classifierModelType';
import { SuggestionResultSchema } from './types/suggestionResultType';
import { buildSuggestionResult, flattenSuggestionResults } from './utils/suggestionQuery';
import { getValuesSortedByName } from './utils/valuesSort';

export type ThesaurusCockpitProps = {
  thesaurus: ThesaurusSchema;
  models: ClassifierModelSchema[];
  suggestionsTBPublished: SuggestionResultSchema;
  suggestionsTBReviewed: SuggestionResultSchema;
};

interface ThesaurusCockpitBaseState {
  isLearning: boolean;
  isReadyForReview: boolean;
}

export class ThesaurusCockpitBase extends RouteHandler {
  constructor(props: ThesaurusCockpitProps, context: any) {
    super(props, context);
    this.state = {
      isLearning: false,
      isReadyForReview: false,
    };
  }

  static genIcons(label: string, actual: number, possible: number) {
    const icons = [];
    for (let i = 0; i < possible; i += 1) {
      let iconClass: any = 'circle';
      if (i >= actual) {
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
    propName: string | undefined
  ) {
    const { label, id } = topic;
    const suggestionCount = suggestionResult.thesaurus?.totalValues[`${id}`] ?? 0;

    return (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td title="sample-count">{suggestionCount ? suggestionCount.toLocaleString() : '-'}</td>
        <td title="suggestions-count">
          {suggestionCount ? suggestionCount.toLocaleString() : '-'}
        </td>
        <td title="review-button">
          {suggestionCount > 0 && propName ? (
            <I18NLink
              to={`/review?q=(filters:(_${propName}:(values:!('${id}')),${propName}:(values:!(missing))))&includeUnpublished=1`}
              className="btn btn-default btn-xs"
            >
              <span title="review-button-title">{t('system', 'View suggestions')}</span>
            </I18NLink>
          ) : null}
        </td>
      </tr>
    );
  }

  learningNotice() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;
    const { isLearning, isReadyForReview } = this.state;
    let notice;

    if (isReadyForReview) {
      notice = (
        <Notice title="Ready for review (Last update 2 hours ago)">
          <div>
            Uwazi has suggested labels for your collection. Review them using the &#34;View
            suggestions&#34; button next to each topic. Disable suggestions with the &#34;Show
            suggestions&#34; toggle.
          </div>
        </Notice>
      );
    } else if (isLearning) {
      notice = (
        <Notice
          title={
            <span>
              Learning... <Icon icon="spinner" spin />
            </span>
          }
        >
          <div>
            Uwazi is learning using the labelled documents. This may take up to 2 hours, and once
            completed you can review suggestions made by Uwazi for your collection.
          </div>
        </Notice>
      );
    } else {
      notice = (
        <Notice title="Configure suggestions">
          <div>
            The first step is to label a sample of your documents, so Uwazi can learn which topics
            to suggest when helping you label your collection.
          </div>
          <I18NLink
            title="label-docs"
            to={`/library/?multiEditThesaurus=${thesaurus._id}`}
            className="btn btn-primary get-started"
          >
            <span>{t('System', 'Get started')}</span>
          </I18NLink>
        </Notice>
      );
    }

    return notice;
  }

  topicNodes() {
    const { suggestionsTBReviewed: suggestions, thesaurus } = this.props as ThesaurusCockpitProps;
    const { property } = thesaurus;
    const values = getValuesSortedByName(thesaurus);

    return values.map((topic: ThesaurusValueSchema) =>
      ThesaurusCockpitBase.topicNode(topic, suggestions, property.name)
    );
  }

  static async getAndPopulateSuggestionResults(
    templates: { _id: string }[],
    requestParams: RequestParams,
    queryBuilderFunc: (id: string, prop?: PropertySchema) => any,
    assocProp?: PropertySchema
  ): Promise<SuggestionResultSchema> {
    const docsWithSuggestions = await Promise.all(
      templates.map((template: { _id: string }) => {
        const reqParams = requestParams.set(queryBuilderFunc(template._id, assocProp));
        return api.search(reqParams);
      })
    );
    const sanitizedSuggestionsTBPublished = docsWithSuggestions.map((s: any) =>
      buildSuggestionResult(s, assocProp?.name ?? '')
    );
    return flattenSuggestionResults(sanitizedSuggestionsTBPublished, assocProp?.name ?? '');
  }

  static async requestState(requestParams: RequestParams) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const [thesauri, templates] = await Promise.all([
      ThesauriAPI.getThesauri(requestParams),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ model: thesaurus.name });
    const model: ClassifierModelSchema = await ThesauriAPI.getModelStatus(modelParams);

    const assocProp = resolveTemplateProp(thesaurus, templates);
    thesaurus.property = assocProp;

    const docsWithSuggestionsForPublish = await ThesaurusCockpitBase.getAndPopulateSuggestionResults(
      templates,
      requestParams,
      getReadyToPublishSuggestionsQuery,
      assocProp
    );
    const docsWithSuggestionsForReview = await ThesaurusCockpitBase.getAndPopulateSuggestionResults(
      templates,
      requestParams,
      getReadyToReviewSuggestionsQuery,
      assocProp
    );
    return [
      actions.set('thesauri/thesaurus', thesaurus as ThesaurusSchema),
      actions.set('thesauri/models', [model as ClassifierModelSchema]),
      actions.set(
        'thesauri/suggestionsTBPublished',
        docsWithSuggestionsForPublish as SuggestionResultSchema
      ),
      actions.set(
        'thesauri/suggestionsTBReviewed',
        docsWithSuggestionsForReview as SuggestionResultSchema
      ),
    ];
  }

  componentWillUnmount() {
    this.emptyState();
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('thesauri/models'));
    this.context.store.dispatch(actions.unset('thesauri/thesaurus'));
    this.context.store.dispatch(actions.unset('thesauri/suggestionsTBPublished'));
    this.context.store.dispatch(actions.unset('thesauri/suggestionsTBReviewed'));
  }

  publishButton() {
    const { thesaurus, suggestionsTBPublished: suggestions } = this.props as ThesaurusCockpitProps;

    // Don't show the 'publish' button when there's nothing to be published
    if (!thesaurus || !thesaurus.property || suggestions.totalSuggestions === 0) {
      return null;
    }
    const thesaurusPropertyRefName = thesaurus.property.name;

    return (
      <I18NLink
        title="publish-button"
        to={
          `/uploads/?q=(filters:(_${thesaurusPropertyRefName}:(values:!(any)),${thesaurusPropertyRefName}:(values:!(any))),` +
          'limit:100,order:desc,sort:creationDate)&view=nosearch'
        }
        className="btn btn-primary btn-xs"
      >
        <span>{t('System', 'Review unpublished documents')}</span>
      </I18NLink>
    );
  }

  render() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;
    const { name } = thesaurus;
    if (!name) {
      return <Loader />;
    }
    return (
      <div className="flex panel panel-default">
        <div className="panel-heading">
          {t('System', `Thesauri > ${name}`)}
          {this.publishButton()}
        </div>
        <div className="cockpit">
          {this.learningNotice()}
          <table>
            <thead>
              <tr>
                <th scope="col">{name}</th>
                <th scope="col">{t('System', 'Sample')}</th>
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
        <Footer />
      </div>
    );
  }
}

interface ThesaurusCockpitStore {
  thesauri: {
    thesaurus: IImmutable<ThesaurusSchema>;
    models: IImmutable<ClassifierModelSchema>[];
    suggestionsTBPublished: IImmutable<SuggestionResultSchema>;
    suggestionsTBReviewed: IImmutable<SuggestionResultSchema>;
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

const selectSuggestionsTBPublished = createSelector(
  (state: ThesaurusCockpitStore) => state.thesauri.suggestionsTBPublished,
  suggestionsTBPublished => suggestionsTBPublished.toJS()
);
const selectSuggestionsTBReviewed = createSelector(
  (state: ThesaurusCockpitStore) => state.thesauri.suggestionsTBReviewed,
  suggestionsTBReviewed => suggestionsTBReviewed.toJS()
);

function mapStateToProps(state: ThesaurusCockpitStore) {
  return {
    models: selectModels(state),
    thesaurus: selectThesaurus(state),
    suggestionsTBPublished: selectSuggestionsTBPublished(state),
    suggestionsTBReviewed: selectSuggestionsTBReviewed(state),
  };
}

export default connect(mapStateToProps, null)(ThesaurusCockpitBase);
