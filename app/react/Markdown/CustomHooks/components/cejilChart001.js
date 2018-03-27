import { connect } from 'react-redux';

import api from 'app/Search/SearchAPI';
import { t } from 'app/I18N';

import CejilChart from './CejilChart';

const casesTemplate = '58b2f3a35d59f31e1345b48a';
const provisionalMeasuresTemplate = '58b2f3a35d59f31e1345b4a4';
const countryKey = 'pa_s';

function getData() {
  Promise.all([
    api.search({ types: [casesTemplate, provisionalMeasuresTemplate], limit: 0 }),
    api.search({ types: [casesTemplate], limit: 0 }),
    api.search({ types: [provisionalMeasuresTemplate], limit: 0 })
  ])
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
    const caseResults = this.state.setA.aggregations.all[countryKey].buckets
    .find(caseCountry => caseCountry.key === country.key);
    const provisionalMeasureResults = this.state.setB.aggregations.all[countryKey].buckets
    .find(caseCountry => caseCountry.key === country.key);

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
