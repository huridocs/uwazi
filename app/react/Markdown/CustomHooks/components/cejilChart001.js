import { connect } from 'react-redux';

import api from 'app/Search/SearchAPI';
import { t } from 'app/I18N';

import CejilChart from './CejilChart';
import { findBucketsByCountry } from '../utils/parsingUtils';

const casesTemplate = '58b2f3a35d59f31e1345b48a';
const provisionalMeasuresTemplate = '58b2f3a35d59f31e1345b4a4';
const countryKey = 'pa_s';

function conformSearchQuery(types) {
  return api.search({ types, limit: 0 });
}

function getData() {
  const types = [[casesTemplate, provisionalMeasuresTemplate], [casesTemplate], [provisionalMeasuresTemplate]];
  Promise.all(types.map(conformSearchQuery))
  .then(([groupedResults, setA, setB]) => {
    this.setState({ groupedResults, setA, setB });
  });
}

function prepareData(countries) {
  const caseTemptale = this.props.templates.find(template => template.get('_id') === casesTemplate);
  const caseLabel = t(casesTemplate, caseTemptale.get('name'));

  const provisionalMeasureTemplate = this.props.templates.find(template => template.get('_id') === provisionalMeasuresTemplate);
  const provisionalMeasureLabel = t(provisionalMeasuresTemplate, provisionalMeasureTemplate.get('name'));

  return countries.map((_country) => {
    const country = _country;
    const caseResults = findBucketsByCountry(this.state.setA, countryKey, country.key);
    const provisionalMeasureResults = findBucketsByCountry(this.state.setB, countryKey, country.key);

    country.name = country.label;

    country.setALabel = caseLabel;
    country.setAValue = caseResults ? caseResults.filtered.doc_count : 0;

    country.setBLabel = provisionalMeasureLabel;
    country.setBValue = provisionalMeasureResults ? provisionalMeasureResults.filtered.doc_count : 0;

    return country;
  });
}

export function mapStateToProps({ templates, thesauris }) {
  return { templates, thesauris, getData, prepareData };
}

export default connect(mapStateToProps)(CejilChart);
