import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Immutable from 'immutable';

import api from 'app/Search/SearchAPI';
import { t } from 'app/I18N';

import { StackedDualBarChart } from 'app/Charts';
import Loader from 'app/components/Elements/Loader';

import { sortValues } from '../utils/cejilUtils';

const judgesCommisionersTemplate = '58b2f3a35d59f31e1345b4b6';
const countriesId = '58b2f3a35d59f31e1345b480';
const countryKey = 'pa_s';
const filterProperty = 'mandatos_de_la_corte';
const male = 'dedcc624-0e11-4d4e-90d5-d1c0ea4c7a18';
const female = 'f2457229-e142-4b74-b595-2ac2f9b5f64e';
const sexTranslationsContext = '58b2f3a35d59f31e1345b52d';

export class cejilChart002 extends Component {
  componentDidMount() {
    this.getData();
  }

  getData() {
    const filters = {};
    filters[filterProperty] = { from: -2208988800 };

    const maleFilters = Object.assign({}, filters, { sexo: { values: [male] } });
    const femaleFilters = Object.assign({}, filters, { sexo: { values: [female] } });

    Promise.all([
      api.search({ types: [judgesCommisionersTemplate], filters, limit: 0 }),
      api.search({ types: [judgesCommisionersTemplate], filters: maleFilters, limit: 0 }),
      api.search({ types: [judgesCommisionersTemplate], filters: femaleFilters, limit: 0 })
    ])
    .then(([groupedResults, maleJudges, femaleJudges]) => {
      this.setState({ groupedResults, maleJudges, femaleJudges });
    });
  }

  prepareCountriesData(countries) {
    return countries.map((_country) => {
      const country = _country;
      const maleResults = this.state.maleJudges.aggregations.all[countryKey].buckets
      .find(caseCountry => caseCountry.key === country.key);
      const femaleResults = this.state.femaleJudges.aggregations.all[countryKey].buckets
      .find(caseCountry => caseCountry.key === country.key);

      country.name = country.label;

      country.setALabel = t(sexTranslationsContext, 'Hombre');
      country.setAValue = maleResults ? maleResults.filtered.doc_count : 0;

      country.setBLabel = t(sexTranslationsContext, 'Mujer');
      country.setBValue = femaleResults ? femaleResults.filtered.doc_count : 0;

      return country;
    });
  }

  render() {
    let output = <Loader/>;

    if (this.state && this.state.groupedResults) {
      const { aggregations } = this.state.groupedResults;
      const countriesData = this.props.thesauris.find(thesaury => thesaury.get('_id') === countriesId);

      let countries = sortValues(aggregations.all[countryKey].buckets
      .filter(country => country.filtered.doc_count)
      .map((_country) => {
        const country = _country;
        country.label = countriesData.get('values').find(v => v.get('id') === country.key).get('label');
        country.results = country.filtered.doc_count;
        return country;
      }));

      countries = this.prepareCountriesData(countries);

      output = (
        <div className="item item-chart">
          <p>{this.props.label}</p>
          <StackedDualBarChart data={countries} chartLabel={this.props.label} setA="male" setB="female" />
        </div>
      );
    }

    return (
      <div className="item-group-charts" style={{ paddingTop: '15px', paddingRight: '15px' }}>{output}</div>
    );
  }
}

cejilChart002.defaultProps = {
  label: null,
};

cejilChart002.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  label: PropTypes.string
};

export function mapStateToProps({ thesauris }) {
  return { thesauris };
}

export default connect(mapStateToProps)(cejilChart002);
