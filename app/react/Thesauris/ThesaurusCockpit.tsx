/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import React from 'react';
import { connect } from 'react-redux';
import { t } from 'app/I18N';
import { request } from 'https';

/** Model is the type used for holding information about a classifier model. */
interface ClassifierModel {
  name: string;
  preferred: string;
  bert: string;
  sample: number;
}

class ThesaurusCockpit extends RouteHandler {
  static async requestState(requestParams: any) {
    // Thesauri should always have a length of 1
    const thesauri = await ThesaurisAPI.getThesauri(requestParams);
    const thesaurus = thesauri[0];

    // Fetch models associated with known thesauri.
    const modelParams = requestParams.onlyHeaders().set({ model: thesaurus.name });
    const model: ClassifierModel = await ThesaurisAPI.getModelStatus(modelParams);

    return [actions.set('thesauri/thesaurus', thesaurus), actions.set('thesauri/models', [model])];
  }

  render() {
    const { values: topics } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const { name } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const modelInfo = this.props.models.find((model: Map<string, any>) => {
      return model.name === name;
    });

    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', `${name}`)}</div>
        {modelInfo === undefined ? null : (
          <div className="force-ltr">
            <ul>
              <li key="Training Samples" className="list-group-item">
                Number of documents sampled: {modelInfo.samples}
              </li>
              <li key="BERT Model" className="list-group-item">
                BERT: {modelInfo.bert}
              </li>
              <li key="Classifier Instance" className="list-group-item">
                Classifier Instance: {modelInfo.preferred}
              </li>
              <li key="Completness Score" className="list-group-item">
                Completeness Score: {modelInfo.completeness}
              </li>
              <li key="Extraneous Value Score" className="list-group-item">
                Extraneous Value Score: {modelInfo.extraneous}
              </li>
            </ul>
          </div>
        )}
        <ul className="list-group">
          {topics.map((topic: { label: string }) => (
            <li key={topic.label} className="list-group-item">
              {topic.label}
            </li>
          ))}
        </ul>
        <div className="settings-footer" />
      </div>
    );
  }
}

function mapStateToProps(state: any) {
  console.dir(Object.getOwnPropertyNames(state.thesauri));
  console.dir(Object.getOwnPropertyNames(state.thesauri.models));
  console.dir(Object.getOwnPropertyNames(state.thesauri.thesaurus));
  //console.dir(Object.getOwnPropertyNames(state.thesauri.toJS()));
  console.dir(Object.getOwnPropertyNames(state.thesauri.models.toJS()));
  console.dir(Object.getOwnPropertyNames(state.thesauri.thesaurus.toJS()));
  return {
    models: state.thesauri.models.toJS(),
    thesauri: state.thesauri.thesaurus.toJS(), // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
  };
}

export default connect(
  mapStateToProps,
  null
  //{ withRef: true }
)(ThesaurusCockpit);
