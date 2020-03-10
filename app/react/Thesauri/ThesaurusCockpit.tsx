/* eslint-disable max-lines */
import Footer from 'app/App/Footer';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import { I18NLink, t } from 'app/I18N';
import { IStore, SuggestInfo, TaskState } from 'app/istore';
import SearchAPI from 'app/Search/SearchAPI';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import {
  getReadyToPublishSuggestionsQuery,
  getReadyToReviewSuggestionsQuery,
} from 'app/Settings/utils/suggestions';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { Notice } from 'app/Thesauri/Notice';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import util from 'util';
import { getLabelsQuery } from '../Settings/utils/suggestions';
import {
  startTraining,
  toggleEnableClassification,
  updateTaskState,
} from './actions/cockpitActions';
import { ClassifierModelSchema } from './types/classifierModelType';
import { LabelCountSchema } from './types/labelCountType';
import { buildLabelCounts, flattenLabelCounts } from './utils/suggestionQuery';
import { getValuesSortedByName } from './utils/valuesSort';

export type ThesaurusCockpitProps = {
  thesaurus: ThesaurusSchema;
  suggestInfo: SuggestInfo;
  taskState: TaskState;
  updateTaskState: () => {};
  startTraining: () => {};
  toggleEnableClassification: () => {};
};

export class ThesaurusCockpitBase extends RouteHandler {
  static async getAndPopulateLabelCounts(
    templates: { _id: string }[],
    requestParams: RequestParams,
    queryBuilderFunc: (id: string, prop: PropertySchema) => any,
    assocProp?: PropertySchema,
    countSuggestions: boolean = true
  ): Promise<LabelCountSchema> {
    if (!assocProp) {
      return { totalRows: 0, totalLabels: 0, thesaurus: { propertyName: '', totalValues: {} } };
    }
    const docsWithSuggestions = await Promise.all(
      templates.map((template: { _id: string }) => {
        const reqParams = requestParams.set(queryBuilderFunc(template._id, assocProp));
        return SearchAPI.search(reqParams);
      })
    );
    const sanitizedSuggestionsTBPublished = docsWithSuggestions.map((s: any) =>
      buildLabelCounts(s, assocProp?.name ?? '', countSuggestions)
    );
    return flattenLabelCounts(sanitizedSuggestionsTBPublished, assocProp?.name ?? '');
  }

  static async requestState(requestParams: RequestParams) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const [thesauri, templates] = await Promise.all([
      ThesauriAPI.getThesauri(requestParams),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ thesaurus: thesaurus.name });
    const model: ClassifierModelSchema = await ThesauriAPI.getModelStatus(modelParams);

    const assocProp = resolveTemplateProp(thesaurus, templates);
    thesaurus.property = assocProp;

    const docsWithSuggestionsForPublish = await ThesaurusCockpitBase.getAndPopulateLabelCounts(
      templates,
      requestParams,
      getReadyToPublishSuggestionsQuery,
      assocProp
    );
    const docsWithSuggestionsForReview = await ThesaurusCockpitBase.getAndPopulateLabelCounts(
      templates,
      requestParams,
      getReadyToReviewSuggestionsQuery,
      assocProp
    );
    const docsWithLabels = await ThesaurusCockpitBase.getAndPopulateLabelCounts(
      templates,
      requestParams,
      getLabelsQuery,
      assocProp,
      false
    );
    return [
      actions.set('thesauri.thesaurus', thesaurus as ThesaurusSchema),
      actions.set('thesauri.suggestInfo', {
        model,
        docsWithSuggestionsForPublish,
        docsWithSuggestionsForReview,
        docsWithLabels,
      }),
      updateTaskState(),
    ];
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

  topicNode(topic: ThesaurusValueSchema) {
    const { thesaurus, suggestInfo } = this.props as ThesaurusCockpitProps;
    const { label, id } = topic;
    const suggestionCount =
      suggestInfo.docsWithSuggestionsForReview.thesaurus?.totalValues[`${id}`] ?? 0;
    const labelCount = suggestInfo.docsWithLabels.thesaurus?.totalValues[`${id}`] ?? 0;

    return (
      <tr key={label}>
        <th scope="row">{label}</th>
        <td title="sample-count">{labelCount ? labelCount.toLocaleString() : '-'}</td>
        <td title="suggestions-count">
          {suggestionCount ? suggestionCount.toLocaleString() : '-'}
        </td>
        <td title="review-button">
          {suggestionCount > 0 && thesaurus.enable_classification && thesaurus.property?.name ? (
            <I18NLink
              to={
                `/review?q=(filters:(_${thesaurus.property?.name}:(values:!('${id}')),` +
                `${thesaurus.property?.name}:(values:!(missing))))&includeUnpublished=1`
              }
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
    const isLearning = false;
    const isReadyForReview = false;
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
          <button
            type="button"
            className="btn btn-default"
            onClick={() => this.props.startTraining()}
          >
            <span className="btn-label">{t('System', 'Train model')}</span>
          </button>
        </Notice>
      );
    }

    return notice;
  }

  topicNodes() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;
    const values = getValuesSortedByName(thesaurus);

    return values.map((topic: ThesaurusValueSchema) => this.topicNode(topic));
  }

  interval?: NodeJS.Timeout = undefined;

  componentDidMount() {
    this.interval = setInterval(() => this.props.updateTaskState(), 10000);
  }

  componentWillUnmount() {
    this.emptyState();
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  emptyState() {
    this.context.store.dispatch(actions.unset('thesauri.suggestInfo'));
    this.context.store.dispatch(actions.unset('thesauri.thesaurus'));
  }

  renderEnableSuggestionsToggle() {
    const { thesaurus, suggestInfo } = this.props as ThesaurusCockpitProps;
    const modelAvailable = suggestInfo.model && suggestInfo.model.preferred;
    return (
      (modelAvailable || thesaurus.enable_classification) && (
        <button
          onClick={() => this.props.toggleEnableClassification()}
          className={
            thesaurus.enable_classification
              ? 'btn btn-default btn-xs btn-toggle-on'
              : 'btn btn-default btn-xs btn-toggle-off'
          }
          type="button"
        >
          <Icon icon={thesaurus.enable_classification ? 'toggle-on' : 'toggle-off'} />
          &nbsp;
          <span>{t('System', 'Show Suggestions')}</span>
        </button>
      )
    );
  }

  publishButton() {
    const { thesaurus, suggestInfo } = this.props as ThesaurusCockpitProps;

    // Don't show the 'publish' button when there's nothing to be published
    if (
      !thesaurus ||
      !thesaurus.property ||
      !suggestInfo.docsWithSuggestionsForPublish?.totalLabels
    ) {
      return null;
    }
    const thesaurusPropertyRefName = thesaurus.property.name;

    return (
      <I18NLink
        title="publish-button"
        to={
          `/library/?multiEditThesaurus=${thesaurus._id}&` +
          `q=(filters:(_${thesaurusPropertyRefName}:(values:!(any)),${thesaurusPropertyRefName}:(values:!(any))),` +
          'limit:100,order:desc,sort:creationDate,unpublished:!t)&view=nosearch'
        }
        className="btn btn-primary btn-xs"
      >
        <span>{t('System', 'Review unpublished documents')}</span>
      </I18NLink>
    );
  }

  render() {
    const { thesaurus, taskState } = this.props as ThesaurusCockpitProps;
    const { name } = thesaurus;
    if (!name) {
      return <Loader />;
    }
    return (
      <div className="flex panel panel-default">
        <div className="panel-heading">
          {t('System', `Thesauri > ${name}`)}
          {this.renderEnableSuggestionsToggle()}
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
          <span>{taskState && util.inspect(taskState, false, null)}</span>
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

const selectSuggestInfo = createSelector(
  (state: IStore) => state.thesauri.suggestInfo,
  info => info.toJS()
);

const selectThesaurus = createSelector(
  (state: IStore) => state.thesauri.thesaurus,
  thesaurus => thesaurus.toJS()
);

const selectTaskState = createSelector(
  (state: IStore) => state.thesauri.taskState,
  s => s.toJS()
);

function mapStateToProps(state: IStore) {
  return {
    suggestInfo: selectSuggestInfo(state),
    thesaurus: selectThesaurus(state),
    taskState: selectTaskState(state),
  };
}

export default connect(mapStateToProps, {
  updateTaskState,
  startTraining,
  toggleEnableClassification,
})(ThesaurusCockpitBase);
