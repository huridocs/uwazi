import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Field } from 'react-redux-form';

import SidePanel from 'app/Layout/SidePanel';
import { t } from 'app/I18N';


export function ResultsFiltersPanel({ open }) {
  const filters = [
    {
      label: 'Threshold', model: '.threshold', min: 0, max: 1, step: 0.01
    },
    {
      label: 'Minimum relevant sentences', model: '.minRelevantSentences', min: 0, max: 1, step: 0.01
    },
    {
      label: 'Minimum relevant score', model: '.minRelevantScores', min: 0, max: 100, step: 1
    }
  ];
  return (
    <SidePanel open={open}>
      <div className="sidepanel-body">
        <div className="sidepanel-title">
          { t('System', 'Fine tune')}
        </div>
        <Form model="library.semanticSearch.resultsFilters">
          <div className="view">
            { filters.map(filter => (
              <dl className="metadata-type-text" key={filter.label}>
                <dt>{filter.label}</dt>
                <dd>
                  <Field model={filter.model}>
                    <input type="range" min={filter.min} max={filter.max} step={filter.step} />
                  </Field>
                </dd>
              </dl>
            ))}
          </div>
        </Form>
      </div>
    </SidePanel>
  );
}

ResultsFiltersPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  storeKey: PropTypes.string.isRequired
};

function mapStateToProps(state, { storeKey }) {
  return {
    open: state[storeKey].ui.get('selectedDocuments').size !== 1
  };
}

export default connect(mapStateToProps)(ResultsFiltersPanel);
