import React, { Component } from 'react';
import { connect } from 'react-redux';
import { LocalForm, Form, Field } from 'react-redux-form';

import SidePanel from 'app/Layout/SidePanel';
import { t } from 'app/I18N';

export class ResultsSidePanel extends Component {
  render() {
    return (
      <SidePanel open>
        <div className="sidepanel-body">
          <div className="sidepanel-title">
            { t('System', 'Fine tune')}
          </div>
          <Form model="library.semanticSearch.resultsFilters">
            <div className="semantic-search-filters">
              <div className="semantic-search-filters-item">
                <div className="item-header">
                  Threshold
                </div>
                <Field model=".threshold" dynamic={false}>
                  <input type="range" min="0" max="1" step="0.01"/>
                </Field>
              </div>
              <div className="semantic-search-filters-item">
                <div className="item-header">
                  Minimum relevant sentences
                </div>
                <Field model=".minRelevantSentences" dynamic={false}>
                  <input type="range" min="0" max="100"></input>
                </Field>
              </div>
              <div className="semantic-search-filters-item">
                <div className="item-header">
                  Minimum relevant probability
                </div>
                <Field model=".minRelevantScore" dynamic={false}>
                  <input type="range" min="0" max="1" step="0.01"></input>
                </Field>
              </div>
            </div>
          </Form>
        </div>
      </SidePanel>
    );
  }
}

export default connect()(ResultsSidePanel);
