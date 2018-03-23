import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import api from 'app/Search/SearchAPI';
import {t} from 'app/I18N';

import Loader from 'app/components/Elements/Loader';
import Bars from './cejilChart002Bars';
import {sortValues} from '../utils/cejilUtils';

const judgesCommisionersTemplate = '58b2f3a35d59f31e1345b4b6';
const countriesId = '58b2f3a35d59f31e1345b480';
const countryKey = 'pa_s';
const filterProperty = 'mandatos_de_la_corte';
const male = 'dedcc624-0e11-4d4e-90d5-d1c0ea4c7a18';
const female = 'f2457229-e142-4b74-b595-2ac2f9b5f64e';
const sexTranslationsContext = '58b2f3a35d59f31e1345b52d';

export class cejilChart002 extends Component {

  getData() {
    const filters = {};
    filters[filterProperty] = {from: 1515456000};

    const maleFilters = Object.assign({}, filters, {sexo: {values: [male]}});
    const femaleFilters = Object.assign({}, filters, {sexo: {values: [female]}});

    Promise.all([
      api.search({types: [judgesCommisionersTemplate], filters, limit: 0}),
      api.search({types: [judgesCommisionersTemplate], filters: maleFilters, limit: 0}),
      api.search({types: [judgesCommisionersTemplate], filters: femaleFilters, limit: 0})
    ])
    .then(([groupedResults, maleJudges, femaleJudges]) => {
      this.setState({groupedResults, maleJudges, femaleJudges});
    });
  }

  prepareCountriesData(countries) {
    return countries.map(country => {
      const maleResults = this.state.maleJudges.aggregations.all[countryKey].buckets
                          .find(caseCountry => caseCountry.key === country.key);
      const femaleResults = this.state.femaleJudges.aggregations.all[countryKey].buckets
                            .find(caseCountry => caseCountry.key === country.key);

      country.maleLabel = t(sexTranslationsContext, 'Hombre');
      country.maleResults = maleResults ? maleResults.filtered.doc_count : 0;

      country.femaleLabel = t(sexTranslationsContext, 'Mujer');
      country.femaleResults = femaleResults ? femaleResults.filtered.doc_count : 0;

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

      let countries = sortValues(aggregations.all[countryKey].buckets
                      .filter(country => country.filtered.doc_count)
                      .map(country => {
                        country.label = countriesData.get('values').find(v => v.get('id') === country.key).get('label');
                        country.results = country.filtered.doc_count;
                        return country;
                      }));

      countries = this.prepareCountriesData(countries);

      console.log('Final countries:', countries);

      output = <div className="item item-chart">
                <p>{this.props.label}</p>
                <Bars data={countries} chartLabel={this.props.label} setA="male" setB="female" />
               </div>;
    }

    return (
      <div className="item-group-charts" style={{paddingTop: '15px'}}>{output}</div>
    );
  }
}

cejilChart002.propTypes = {
  templates: PropTypes.object,
  thesauris: PropTypes.object,
  label: PropTypes.string
};

export function mapStateToProps({templates, thesauris}) {
  return {templates, thesauris};
}

export default connect(mapStateToProps)(cejilChart002);
