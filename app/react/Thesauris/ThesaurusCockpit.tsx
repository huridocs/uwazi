/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import { t, I18NLink } from 'app/I18N';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import React from 'react';
import { connect } from 'react-redux';
import { Icon } from 'UI';

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
}

function qualityIcon(val: number) {
  switch (true) {
    case val > 0.85:
      return (
        <div className="quality-icon quality-high">
          <Icon icon="circle" />
          <Icon icon="circle" />
          <Icon icon="circle" />
        </div>
      );
    case val > 0.7:
      return (
        <div className="quality-icon quality-med">
          <Icon icon="circle" />
          <Icon icon="circle" />
          <Icon icon={['far', 'circle']} />
        </div>
      );
    default:
      return (
        <div className="quality-icon quality-low">
          <Icon icon="circle" />
          <Icon icon={['far', 'circle']} />
          <Icon icon={['far', 'circle']} />
        </div>
      );
  }
}

function topicNode(topic: ThesaurusTopic, modelInfo: ClassifierModel) {
  const { label, id } = topic;
  const { quality = 0, samples = 0 } = modelInfo.topics[label] || {};
  // TODO(sam): Use template field name instead of thesaurus name.
  const thesaurusName = modelInfo.name.toLowerCase();

  return (
    <tr key={label}>
      <th scope="row">{label}</th>
      <td>{qualityIcon(quality)}</td>
      <td>{samples}</td>
      <td>
        <I18NLink
          to={`/review?q=(filters:(_${thesaurusName}:(values:!('${id}')),${thesaurusName}:(values:!(missing))))&includeUnpublished=1`}
          className="btn btn-default btn-xs"
        >
          <Icon icon="gavel" />
          &nbsp;
          <span>{t('system', 'Review suggestions')}</span>
        </I18NLink>
      </td>
    </tr>
  );
}

function topicNodes(topics: Array<any>, model: ClassifierModel) {
  if (topics === undefined) {
    return null;
  }
  return topics
    .sort(
      // Sort in order of descending model quality
      // TODO: Make sort order configurable, or even better, dynamic
      (topic1: ThesaurusTopic, topic2: ThesaurusTopic) => {
        const { quality: q1 = 0 } = model.topics[topic1.label] || {};
        const { quality: q2 = 0 } = model.topics[topic2.label] || {};
        return q2 - q1;
      }
    )
    .map((topic: ThesaurusTopic) => topicNode(topic, model));
}

class ThesaurusCockpit extends RouteHandler {
  static async requestState(requestParams: any) {
    // Thesauri should always have a length of 1, because a specific thesaurus ID is passed in the requestParams.
    const thesauri = await ThesaurisAPI.getThesauri(requestParams);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ model: thesaurus.name });
    const model: ClassifierModel = await ThesaurisAPI.getModelStatus(modelParams);

    return [actions.set('thesauri/thesaurus', thesaurus), actions.set('thesauri/models', [model])];
  }

  render() {
    const { values: topics, name } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const modelInfo = this.props.models.find((model: ClassifierModel) => model.name === name);

    // TODO(sam): Use template field name instead of thesaurus name.
    const thesaurusName = modelInfo.name.toLowerCase();

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          {t('System', `Thesauri > ${name}`)}
          <I18NLink
            to={`/uploads/?q=(filters:(_${thesaurusName}:(values:!(any)),${thesaurusName}:(values:!(any))),limit:100,order:desc,sort:creationDate)&view=nosearch`}
            className="btn btn-primary btn-xs"
          >
            <Icon icon="search" />
            &nbsp;
            <span>{t('System', 'Review & Publish')}</span>
          </I18NLink>
        </div>
        <div className="cockpit">
          <table>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Quality</th>
                <th scope="col">Samples Used in Training</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>{topicNodes(topics, modelInfo)}</tbody>
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

function mapStateToProps(state: any) {
  return {
    models: state.thesauri.models.toJS(), // {name: ModelName; bert: bert123; sample: 53}
    thesauri: state.thesauri.thesaurus.toJS(), // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
  };
}

export default connect(
  mapStateToProps,
  null
  //{ withRef: true }
)(ThesaurusCockpit);
