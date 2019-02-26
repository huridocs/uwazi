import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Field } from 'react-redux-form';


import SidePanel from 'app/Layout/SidePanel';
import { t } from 'app/I18N';


export function ResultsFiltersPanel({ open, filtersValues }) {
  const filters = [
    {
      label: 'Threshold', model: 'threshold', min: 0.05, max: 1, step: 0.05, defaultValue: 0.2
    },
    {
      label: 'Minimum relevant sentences', model: 'minRelevantSentences', min: 1, max: 50, step: 1, defaultValue: 1
    },
    {
      label: 'Minimum relevant score', model: 'minRelevantScores', min: 5, max: 100, step: 5, defaultValue: 20
    }
  ];

  return (
    <SidePanel open={open}>
      <div className="sidepanel-body">
        <div className="sidepanel-title">
          { t('System', 'Fine tune')}
        </div>
        <Form model="semanticSearch.resultsFilters">
          <div className="view">
            { filters.map(filter => (
              <dl className="metadata-type-text" key={filter.label}>
                <dt>{t('System', filter.label)} {filtersValues[filter.model]}</dt>
                <dd>
                  <Field model={`.${filter.model}`}>
                    <input
                      type="range"
                      list={`${filter.label}tickmarks`}
                      min={filter.min}
                      max={filter.max}
                      step={filter.step}
                      defaultValue={filter.defaultValue}
                    />
                    <datalist id={`${filter.label}tickmarks`}>
                      <option value={filter.min}/>
                      {(() => {
                        const options = [];
                        for (let i = filter.min * 2; i < filter.max; i += filter.step) {
                          options.push(<option key={i} value={i}/>);
                        }
                        return options;
                      })()}
                      <option value={filter.max}/>
                    </datalist>
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
  filtersValues: PropTypes.object.isRequired,
  storeKey: PropTypes.string.isRequired
};

function mapStateToProps({ semanticSearch }) {
  return {
    open: semanticSearch.selectedDocument.isEmpty(),
    filtersValues: semanticSearch.resultsFilters
  };
}

export default connect(mapStateToProps)(ResultsFiltersPanel);
