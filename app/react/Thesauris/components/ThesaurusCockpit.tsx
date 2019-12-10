/** @format */
import { ThesaurusSchema } from 'api/thesauris/dictionariesType';
import { t } from 'app/I18N';
import { List } from 'immutable';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

interface ThesaurusCockpitProps {
  thesauris: List<ThesaurusSchema>;
  thesauri: any;
  state: any;
}

export class ThesaurusCockpit extends Component<ThesaurusCockpitProps> {
  render() {
    const { values: topics } = this.props.thesauri; // {name: Themes; values: [{label: Education}, ...]}
    return (
      <div className="panel panel-default">
        <div className="panel-heading">{t('System', 'Thesaurus')}</div>
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
  console.dir(state.thesauris);
  return {
    thesauri: state.thesauri.data, // {name: Themes; values: [{label: Education, id: lkajsdf}, ...]}
    thesauris: state.thesauris,
  };
}

export default connect(
  mapStateToProps
  //null,
  //{ withRef: true }
)(ThesaurusCockpit);
