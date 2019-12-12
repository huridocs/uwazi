/** @format */
import RouteHandler from 'app/App/RouteHandler';
import { actions } from 'app/BasicReducer';
import ThesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import React from 'react';
import { connect } from 'react-redux';
import { t } from 'app/I18N';

/** Model is the type used for holding information about a classifier model. */
interface ClassifierModel {
  name: string;
  preferred: string;
  bert: string;
  sample: number;
}

class ThesaurusCockpit extends RouteHandler {
  static async requestState(requestParams: any) {
    const request = requestParams.onlyHeaders();
    const [thesauri] = await Promise.all([ThesaurisAPI.getThesauri(request)]);

    // Fetch models associated with known thesauri.
    const allModels: Array<ClassifierModel> = await Promise.all(
      thesauri.map((thesaurus: { name: string }) =>
        ThesaurisAPI.getModelStatus(request.set({ model: thesaurus.name }))
      )
    );
    const models: Array<ClassifierModel> = allModels.filter(
      model => !model.hasOwnProperty('error')
    );

    const modeledThesauri = thesauri.map((thesaurus: { name: any }) => {
      const relevantModel = models.find(model => model.name === thesaurus.name);
      if (relevantModel !== undefined) {
        return {
          ...thesaurus,
          model_available: relevantModel.preferred != null,
        };
      }
      return { ...thesaurus, model_available: false };
    });

    return [actions.set('dictionaries', modeledThesauri), actions.set('thesauri/models', models)];
  }

  render() {
    const { values: topics } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const { name } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const modelInfo = this.props.models.find((model: Map<string, any>) => {
      return model.get('name') === name;
    });

    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', `${name}`)}</div>
        {modelInfo === undefined ? null : (
          <div className="force-ltr">
            <ul>
              <li key="Training Samples" className="list-group-item">
                Number of documents sampled: {modelInfo.get('samples')}
              </li>
              <li key="BERT Model" className="list-group-item">
                BERT: {modelInfo.get('bert')}
              </li>
              <li key="Classifier Instance" className="list-group-item">
                Classifier Instance: {modelInfo.get('preferred')}
              </li>
              <li key="Completness Score" className="list-group-item">
                Completeness Score: {modelInfo.get('completeness')}
              </li>
              <li key="Extraneous Value Score" className="list-group-item">
                Extraneous Value Score: {modelInfo.get('extraneous')}
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
  return {
    models: state.thesauri.models,
    // TODO: FIX ME THIS IS EMPTY
    thesauri: state.thesauri.data, // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
  };
}

export default connect(
  mapStateToProps,
  null
  //{ withRef: true }
)(ThesaurusCockpit);
