/* eslint-disable max-lines,camelcase */
import Footer from 'app/App/Footer';
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import Loader from 'app/components/Elements/Loader';
import { I18NLink, t, Translate } from 'app/I18N';
import { IStore, ThesaurusSuggestions, TasksState } from 'app/istore';
import { resolveTemplateProp } from 'app/Settings/utils/resolveProperty';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { Notice } from 'app/Thesauri/Notice';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Icon } from 'UI';
import {
  startTraining,
  toggleEnableClassification,
  updateCockpitData,
} from './actions/cockpitActions';
import { getValuesSortedByName } from './utils/valuesSort';

type ThesaurusCockpitProps = {
  thesaurus: ThesaurusSchema;
  suggestInfo: ThesaurusSuggestions;
  tasksState: TasksState;
  topicClassificationEnabled: boolean;
  updateCockpitData: () => {};
  startTraining: () => {};
  toggleEnableClassification: () => {};
};

class ThesaurusCockpitBase extends RouteHandler {
  static async requestState(requestParams: RequestParams) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const [thesauri, templates] = await Promise.all([
      ThesauriAPI.getThesauri(requestParams),
      TemplatesAPI.get(requestParams.onlyHeaders()),
    ]);
    const thesaurus = thesauri[0];

    const assocProp = resolveTemplateProp(thesaurus, templates);
    return [
      actions.set('templates', templates),
      actions.set('thesauri.thesaurus', thesaurus as ThesaurusSchema),
      actions.set('thesauri.suggestInfo', {
        property: assocProp,
      } as ThesaurusSuggestions),
      updateCockpitData(requestParams),
    ];
  }

  topicNode(topic: ThesaurusValueSchema) {
    const { thesaurus, suggestInfo } = this.props as ThesaurusCockpitProps;
    const { label, id } = topic;
    const suggestionCount =
      suggestInfo.docsWithSuggestionsForReview?.thesaurus?.totalValues[`${id}`] ?? 0;
    const labelCount = suggestInfo.docsWithLabels?.thesaurus?.totalValues[`${id}`] ?? 0;

    const topicQuality =
      (suggestInfo.model?.topics ?? {})[label] ?? (suggestInfo.model?.topics ?? {})[id!];
    return (
      <tr key={label}>
        <th scope="row">
          {label}
          {topicQuality && !!topicQuality.quality && topicQuality.quality < 0.5 && (
            <span className="property-help confidence-bubble low">
              <Translate>low</Translate>
              <div className="property-description">
                <Translate>
                  Improve the quality of this topic's suggestions by finding more sample documents
                  with this label.
                </Translate>
              </div>
            </span>
          )}
        </th>
        <td title="sample-count">{labelCount ? labelCount.toLocaleString() : '-'}</td>
        <td title="suggestions-count">
          {suggestionCount ? suggestionCount.toLocaleString() : '-'}
        </td>
        <td title="review-button">
          {suggestionCount > 0 && thesaurus.enable_classification && suggestInfo.property?.name ? (
            <I18NLink
              to={
                `/review?q=(filters:(__${suggestInfo.property?.name}:(values:!('${id}')),` +
                `${suggestInfo.property?.name}:(values:!(missing))))&includeUnpublished=1`
              }
              className="btn btn-default btn-xs"
            >
              <span title="review-button-title">{t('System', 'View suggestions')}</span>
            </I18NLink>
          ) : null}
        </td>
      </tr>
    );
  }

  learningNotice() {
    const { thesaurus, tasksState, suggestInfo } = this.props as ThesaurusCockpitProps;
    const numTopics = getValuesSortedByName(thesaurus).length;
    const numTrained =
      (suggestInfo.model?.config?.num_test ?? 0) + (suggestInfo.model?.config?.num_train ?? 0);
    const numLabeled = suggestInfo.docsWithLabels?.totalRows;
    const modelTime = suggestInfo.model?.preferred;
    const isLearning = tasksState.TrainState?.state === 'running';
    const modelDate =
      modelTime && +modelTime > 1000000000 && +modelTime < 2000000000
        ? new Date(+modelTime * 1000)
        : null;
    let status;

    if (modelTime) {
      status = (
        <div className="block">
          <div className="stretch">
            <Translate translationKey="Suggested labels description">
              Uwazi has suggested labels for your collection. Review them using the &#34;View
              suggestions&#34; button next to each topic. Disable suggestions with the &#34;Show
              suggestions&#34; toggle.
            </Translate>
            <br />
            <br />
            <Translate>
              You can also improve the model by providing more labeled documents.
            </Translate>
          </div>
          <div className="footer">
            <I18NLink
              title="label-docs"
              to={`/library/?quickLabelThesaurus=${thesaurus._id}&q=(allAggregations:!t,includeUnpublished:!t)`}
              className="btn btn-primary get-started"
            >
              <Translate>Label more documents</Translate>
            </I18NLink>
          </div>
        </div>
      );
    } else {
      status = (
        <div className="block">
          <div className="stretch">
            <Translate>
              The first step is to label a sample of your documents, so Uwazi can learn which topics
              to suggest when helping you label your collection.
            </Translate>
          </div>
          <div className="footer">
            <I18NLink
              title="label-docs"
              to={`/library/?quickLabelThesaurus=${thesaurus._id}&q=(allAggregations:!t,includeUnpublished:!t)`}
              className="btn btn-primary get-started"
            >
              <span>{t('System', numLabeled === 0 ? 'Get started' : 'Label more documents')}</span>
            </I18NLink>
          </div>
        </div>
      );
    }
    const learning = (
      <div className="block">
        <div className="stretch">
          {modelDate && (
            <>
              <Translate>The current model was trained at</Translate>&nbsp;
              {modelDate.toLocaleString()} <Translate>with</Translate> {numTrained}&nbsp;
              <Translate>documents.</Translate>
              <br />
              <br />
            </>
          )}
          {(numLabeled ?? 0) < numTopics * 30 && (
            <>
              <Translate>We recommend labeling</Translate> {numTopics * 30}{' '}
              <Translate>documents before training (30 per topic).</Translate>
              <br />
              <br />
            </>
          )}
          <Translate>You have labeled</Translate> {numLabeled}{' '}
          <Translate>documents so far.</Translate>
          {isLearning && (
            <>
              <br />
              <br />
              <Translate>
                Uwazi is learning using the labelled documents. This may take up to 2 hours, and
                once completed you can review suggestions made by Uwazi for your collection.
              </Translate>
            </>
          )}
        </div>
        <div className="footer">
          {isLearning && (
            <div className="btn-label property-help">
              <span>
                <Translate>Learning...</Translate> <Icon icon="spinner" spin />
              </span>
              <div className="property-description">{tasksState.TrainState?.message}</div>
            </div>
          )}
          {!isLearning && numLabeled && numLabeled > numTrained && numLabeled > numTopics * 20 && (
            <button
              type="button"
              className="btn btn-default"
              onClick={() => this.props.startTraining()}
            >
              <span className="btn-label">{t('System', 'Train model')}</span>
            </button>
          )}
        </div>
      </div>
    );
    return (
      <Notice title="Suggestion Status">
        {status}
        {learning}
      </Notice>
    );
  }

  topicNodes() {
    const { thesaurus } = this.props as ThesaurusCockpitProps;
    const values = getValuesSortedByName(thesaurus);

    return values.map((topic: ThesaurusValueSchema) => this.topicNode(topic));
  }

  interval?: number = undefined;

  componentDidMount() {
    this.interval = window.setInterval(() => this.props.updateCockpitData(), 10000);
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
    this.context.store.dispatch(actions.unset('thesauri.tasksState'));
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
      !suggestInfo.property ||
      !suggestInfo.docsWithSuggestionsForPublish?.totalLabels
    ) {
      return null;
    }
    const thesaurusPropertyRefName = suggestInfo.property.name;

    return (
      <I18NLink
        title="publish-button"
        to={
          `/library/?quickLabelThesaurus=${thesaurus._id}&` +
          `q=(filters:(__${thesaurusPropertyRefName}:(values:!(any)),${thesaurusPropertyRefName}:(values:!(any))),` +
          'limit:100,order:desc,sort:creationDate,unpublished:!t)'
        }
        className="btn btn-primary btn-xs"
      >
        <Translate>Review unpublished document</Translate>
      </I18NLink>
    );
  }

  render() {
    const { thesaurus, tasksState, topicClassificationEnabled } = this
      .props as ThesaurusCockpitProps;
    const { name } = thesaurus;
    if (!name || !tasksState.SyncState?.state) {
      return (
        <div className="settings-content">
          <Loader />
        </div>
      );
    }
    return (
      <div className="settings-content">
        <div className="flex thesaurus-cockpit panel panel-default">
          <div className="panel-heading">
            {t('System', `Thesauri > ${name}`)}
            {this.renderEnableSuggestionsToggle()}
            {this.publishButton()}
          </div>
          <div className="cockpit">
            {topicClassificationEnabled && this.learningNotice()}
            <table>
              <thead>
                <tr>
                  <th scope="col">{name}</th>
                  <th scope="col">
                    <Translate>Sample</Translate>
                  </th>
                  <th scope="col">
                    <Translate>Documents to be reviewed</Translate>
                  </th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>{this.topicNodes()}</tbody>
            </table>
            <div className="sync-state">{tasksState.SyncState.message}</div>
          </div>
          <div className="settings-footer">
            <I18NLink to="/settings/dictionaries" className="btn btn-default">
              <Icon icon="arrow-left" />
              <span className="btn-label">{t('System', 'Back')}</span>
            </I18NLink>
          </div>
          <Footer />
        </div>
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

const selectTasksState = createSelector(
  (state: IStore) => state.thesauri.tasksState,
  s => s.toJS()
);

function mapStateToProps(state: IStore) {
  return {
    suggestInfo: selectSuggestInfo(state),
    thesaurus: selectThesaurus(state),
    tasksState: selectTasksState(state),
    topicClassificationEnabled: (state.settings.collection.toJS().features || {})
      .topicClassification,
  };
}

export { ThesaurusCockpitBase };
export type { ThesaurusCockpitProps };

export default connect(mapStateToProps, {
  updateCockpitData,
  startTraining,
  toggleEnableClassification,
})(ThesaurusCockpitBase);
