import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { StackedDualBarChart, arrayUtils } from 'app/Charts';
import { Loader } from 'app/components/Elements/Loader';
import { t } from 'app/I18N';

const countriesTemplate = '58b2f3a35d59f31e1345b480';
const countryKey = 'pa_s';

class CejilChart extends Component {
  componentDidMount() {
    this.props.getData.call(this).then(([groupedResults, setA, setB]) => {
      this.setState({ groupedResults, setA, setB });
    });
  }

  render() {
    let output = <Loader />;

    if (this.state && this.state.groupedResults) {
      const { aggregations } = this.state.groupedResults;
      const countriesData = this.props.thesauris.find(
        thesaury => thesaury.get('_id') === countriesTemplate
      );

      let data = arrayUtils.sortValues(
        aggregations.all[countryKey].buckets
          .filter(country => country.filtered.doc_count && country.key !== 'any')
          .map(_country => {
            const country = _country;
            const foundCountry = countriesData.get('values').find(v => v.get('id') === country.key);
            country.label = foundCountry
              ? foundCountry.get('label')
              : t('System', 'No Value', null, false);
            country.results = country.filtered.doc_count;
            return country;
          })
      );

      data = this.props.prepareData.call(this, data, this.state.setA, this.state.setB);

      output = (
        <div className="item item-chart">
          <p>{this.props.label}</p>
          <StackedDualBarChart data={data} chartLabel={this.props.label} />
        </div>
      );
    }

    return (
      <div className="item-group-charts" style={{ paddingTop: '15px', paddingRight: '15px' }}>
        {output}
      </div>
    );
  }
}

CejilChart.defaultProps = {
  label: null,
};

CejilChart.propTypes = {
  thesauris: PropTypes.instanceOf(Immutable.List).isRequired,
  label: PropTypes.string,
  getData: PropTypes.func.isRequired,
  prepareData: PropTypes.func.isRequired,
};

export default CejilChart;
export { countriesTemplate, countryKey };
