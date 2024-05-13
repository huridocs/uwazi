import { connect } from 'react-redux';

import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/Search/SearchAPI';
import { t } from 'app/I18N';

import CejilChart from './CejilChart';
import parsingUtils from '../utils/parsingUtils';

const judgesCommisionersTemplate = '58b2f3a35d59f31e1345b4b6';
const countryKey = 'pa_s';
const male = 'dedcc624-0e11-4d4e-90d5-d1c0ea4c7a18';
const female = 'f2457229-e142-4b74-b595-2ac2f9b5f64e';
const sexTranslationsContext = '58b2f3a35d59f31e1345b52d';

function assignFilter(filters, sex) {
  return { ...filters, sexo: { values: [sex] } };
}

function conformSearchQuery(filters) {
  return api.search(new RequestParams({ types: [judgesCommisionersTemplate], filters, limit: 0 }));
}

function getData() {
  const filters = {};
  filters[this.props.filterProperty] = { from: -2208988800 };

  const maleFilters = assignFilter(filters, male);
  const femaleFilters = assignFilter(filters, female);

  return Promise.all([filters, maleFilters, femaleFilters].map(conformSearchQuery));
}

function prepareData(countries, setA, setB) {
  return countries.map(_country => {
    const country = _country;
    const maleResults = parsingUtils.findBucketsByCountry(setA, countryKey, country.key);
    const femaleResults = parsingUtils.findBucketsByCountry(setB, countryKey, country.key);

    country.name = country.label;

    country.setALabel = t(sexTranslationsContext, 'Hombre', null, false);
    country.setAValue = maleResults ? maleResults.filtered.doc_count : 0;

    country.setBLabel = t(sexTranslationsContext, 'Mujer', null, false);
    country.setBValue = femaleResults ? femaleResults.filtered.doc_count : 0;

    return country;
  });
}

function mapStateToProps({ thesauris }, { filterProperty = 'mandatos_de_la_corte' }) {
  return { thesauris, getData, prepareData, filterProperty };
}

export default connect(mapStateToProps)(CejilChart);
export {
  judgesCommisionersTemplate,
  countryKey,
  male,
  female,
  sexTranslationsContext,
  mapStateToProps,
};
