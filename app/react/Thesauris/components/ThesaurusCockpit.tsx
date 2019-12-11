/** @format */
import { ThesaurusSchema } from 'api/thesauris/dictionariesType';
import { t } from 'app/I18N';
import { List } from 'immutable';
import React, { Component } from 'react';
import { connect } from 'react-redux';

interface ThesaurusCockpitProps {
  /** models: this contains information known about the classification model. */
  models: any;
  thesauris: List<ThesaurusSchema>;
  /** thesauri: this contains the thesaurus object, containing its topics. */
  thesauri: any;
  //state: any;
}

export class ThesaurusCockpit extends Component<ThesaurusCockpitProps> {
  render() {
    const { values: topics } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const { name } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    const modelInfo = this.props.models.find((model: Map<string, any>) => {
      return model.get('name') === name;
    });
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', `Thesaurus: ${name}`)}</div>
        {modelInfo === undefined ? null : (
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
        )}
        <ul className="list-group">
          {topics.map((topic: { label: string }) => (
            <li key={topic.label} className="list-group-item">
              {topic.label}
            </li>
          ))}
        </ul>
        <div className="settings-footer"></div>
      </div>
    );
  }
}

export function mapStateToProps(state: any) {
  return {
    models: state.thesauri.models,
    thesauri: state.thesauri.data, // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
    thesauris: state.thesauris,
  };
}

export default connect(
  mapStateToProps
  //null,
  //{ withRef: true }
)(ThesaurusCockpit);
