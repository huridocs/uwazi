import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import api from 'app/Search/SearchAPI';
import CejilChart, { mapStateToProps, judgesCommisionersTemplate as template, male, female } from '../CejilChart002';
import { countriesTemplate, countryKey } from '../CejilChart';


describe('CejilChart002', () => {
  let props;

  function conformAggregations(countA, countB) {
    const response = { aggregations: { all: { } } };
    response.aggregations.all[countryKey] = { buckets: [
      { key: 'keyA', filtered: { doc_count: countA } },
      { key: 'keyB', filtered: { doc_count: countB } },
    ] };
    return response;
  }

  function testSnapshot() {
    const tree = shallow(<CejilChart.WrappedComponent {...props} />);
    expect(tree).toMatchSnapshot();
  }

  beforeEach(() => {
    props = mapStateToProps({
      thesauris: fromJS([
        { _id: countriesTemplate, values: [{ id: 'keyA', label: 'labelA' }, { id: 'keyB', label: 'labelB' }] },
        { _id: 'otherThesauri' }
      ])
    }, {});
  });

  describe('When no data loaded', () => {
    it('should output only the loader before loading data', () => {
      spyOn(api, 'search').and.returnValue(Promise.resolve(null));
      testSnapshot();
    });
  });

  describe('When data loaded', () => {
    beforeEach(() => {
      spyOn(api, 'search').and.callFake((args) => {
        const combinedQuery = args.types[0] === template && !args.filters.sexo;
        const maleQuery = args.types[0] === template && args.filters.sexo && args.filters.sexo.values[0] === male;
        const femaleQuery = args.types[0] === template && args.filters.sexo && args.filters.sexo.values[0] === female;

        if (combinedQuery) {
          if (Object.keys(args.filters).indexOf('mandatos_de_la_corte') !== -1) {
            return Promise.resolve(conformAggregations(5, 8));
          }
          return Promise.resolve(conformAggregations(6, 9));
        }

        if (maleQuery) {
          return Promise.resolve(conformAggregations(3, 1));
        }

        if (femaleQuery) {
          return Promise.resolve(conformAggregations(2, 7));
        }

        fail(`Unexpected call: ${JSON.stringify(args)}`);
        return Promise.resolve();
      });
    });

    it('should sort and format the results appropriately', (done) => {
      const tree = shallow(<CejilChart.WrappedComponent {...props} />);
      setImmediate(() => {
        tree.update();
        expect(tree).toMatchSnapshot();
        done();
      }, 0);
    });

    it('should allow changing the filter property', (done) => {
      props.filterProperty = 'mandatos_de_la_comisi_n';
      const tree = shallow(<CejilChart.WrappedComponent {...props} />);
      setImmediate(() => {
        tree.update();
        expect(tree).toMatchSnapshot();
        done();
      }, 0);
    });
  });
});
