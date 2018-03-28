import { connect } from 'react-redux';

import api from 'app/Search/SearchAPI';
import { t } from 'app/I18N';

import CejilChart from './CejilChart';
import { findBucketsByCountry } from '../utils/parsingUtils';

export const judgesCommisionersTemplate = '58b2f3a35d59f31e1345b4b6';
export const countryKey = 'pa_s';
export const male = 'dedcc624-0e11-4d4e-90d5-d1c0ea4c7a18';
export const female = 'f2457229-e142-4b74-b595-2ac2f9b5f64e';
export const sexTranslationsContext = '58b2f3a35d59f31e1345b52d';

function assignFilter(filters, sex) {
  return Object.assign({}, filters, { sexo: { values: [sex] } });
}

function conformSearchQuery(filters) {
  return api.search({ types: [judgesCommisionersTemplate], filters, limit: 0 });
}

function getData() {
  const filters = {};
  filters[this.props.filterProperty] = { from: -2208988800 };

  const maleFilters = assignFilter(filters, male);
  const femaleFilters = assignFilter(filters, female);

  return Promise.all([filters, maleFilters, femaleFilters].map(conformSearchQuery));
}

function prepareData(countries, setA, setB) {
  return countries.map((_country) => {
    const country = _country;
    const maleResults = findBucketsByCountry(setA, countryKey, country.key);
    const femaleResults = findBucketsByCountry(setB, countryKey, country.key);

    country.name = country.label;

    country.setALabel = t(sexTranslationsContext, 'Hombre');
    country.setAValue = maleResults ? maleResults.filtered.doc_count : 0;

    country.setBLabel = t(sexTranslationsContext, 'Mujer');
    country.setBValue = femaleResults ? femaleResults.filtered.doc_count : 0;

    return country;
  });
}

export function mapStateToProps({ thesauris }, { filterProperty = 'mandatos_de_la_corte' }) {
  return { thesauris, getData, prepareData, filterProperty };
}

export default connect(mapStateToProps)(CejilChart);
