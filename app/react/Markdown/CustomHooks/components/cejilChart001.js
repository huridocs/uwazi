import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import api from 'app/Search/SearchAPI';
import {t} from 'app/I18N';

import Loader from 'app/components/Elements/Loader';
import Bars from './cejilChart001Bars';

const casesId = '58b2f3a35d59f31e1345b48a';
const provisionalMeasuresId = '58b2f3a35d59f31e1345b4a4';
const countriesId = '58b2f3a35d59f31e1345b480';
const countryKey = 'pa_s';

export class cejilChart001 extends Component {

  getData() {
    Promise.all([
      api.search({types: [casesId, provisionalMeasuresId], limit: 0}),
      api.search({types: [casesId], limit: 0}),
      api.search({types: [provisionalMeasuresId], limit: 0})
    ])
    .then(([groupedResults, cases, provisionalMeasures]) => {
      this.setState({groupedResults, cases, provisionalMeasures});
    });
  }

  sortValues(countries) {
    countries.sort((a, b) => {
      if (a.results === b.results) {
        return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      }

      return b.results - a.results;
    });

    return countries;
  }

  prepareCountriesData(countries) {
    const caseTemptale = this.props.templates.find(template => template.get('_id') === casesId);
    const caseLabel = t(casesId, caseTemptale.get('name'));

    const provisionalMeasureTemplate = this.props.templates.find(template => template.get('_id') === provisionalMeasuresId);
    const provisionalMeasureLabel = t(provisionalMeasuresId, provisionalMeasureTemplate.get('name'));

    return countries.map(country => {
      const caseResults = this.state.cases.aggregations.all[countryKey].buckets
                          .find(caseCountry => caseCountry.key === country.key);
      const provisionalMeasureResults = this.state.provisionalMeasures.aggregations.all[countryKey].buckets
                                        .find(caseCountry => caseCountry.key === country.key);

      country.caseLabel = caseLabel;
      country.caseResults = caseResults ? caseResults.filtered.doc_count : 0;

      country.provisionalMeasureLabel = provisionalMeasureLabel;
      country.provisionalMeasureResults = provisionalMeasureResults ? provisionalMeasureResults.filtered.doc_count : 0;

      return country;
    });
  }

  componentDidMount() {
    this.getData();
  }

  render() {
    let output = <Loader/>;

    if (this.state && this.state.groupedResults) {
      const aggregations = this.state.groupedResults.aggregations;
      const countriesData = this.props.thesauris.find(thesaury => thesaury.get('_id') === countriesId);
      let countries = this.sortValues(aggregations.all[countryKey].buckets
                      .filter(country => country.filtered.doc_count)
                      .map(country => {
                        country.label = countriesData.get('values').find(v => v.get('id') === country.key).get('label');
                        country.results = country.filtered.doc_count;
                        return country;
                      }));

      countries = this.prepareCountriesData(countries);

      output = <div className="item item-chart">
                <p>{this.props.label}</p>
                <Bars data={countries} chartLabel={this.props.label} />
               </div>;
    }

    return (
      <div className="item-group-charts" style={{paddingTop: '15px', paddingRight: '15px'}}>{output}</div>
    );
  }
}

cejilChart001.propTypes = {
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  label: PropTypes.string
};

export function mapStateToProps({templates, thesauris}) {
  return {templates, thesauris};
}

export default connect(mapStateToProps)(cejilChart001);
