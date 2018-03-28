import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';

import api from 'app/Search/SearchAPI';
import CejilChart, { mapStateToProps, judgesCommisionersTemplate as template, male, female } from '../CejilChart002';
import { countriesTemplate, countryKey } from '../CejilChart';


describe('CejilChart002', () => {
  let props;

  function conformAggregations(count) {
    const response = { aggregations: { all: { } } };
    response.aggregations.all[countryKey] = { buckets: [
      { key: 'keyA', filtered: { doc_count: count.a } },
      { key: 'keyB', filtered: { doc_count: count.b } },
    ] };
    return response;
  }

  function testSnapshot() {
    const tree = shallow(<CejilChart.WrappedComponent {...props} />);
    expect(tree).toMatchSnapshot();
  }

  function testQuery(args, sex) {
    return args.types[0] === template && args.filters.sexo && args.filters.sexo.values[0] === sex;
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
        const maleQuery = testQuery(args, male);
        const femaleQuery = testQuery(args, female);

        let count = {};

        if (combinedQuery) {
          count = { a: 5, b: 8 };
          if (Object.keys(args.filters).indexOf('mandatos_de_la_corte') !== 0) {
            count = { a: 6, b: 9 };
          }
        }

        if (maleQuery) {
          count = { a: 3, b: 1 };
        }

        if (femaleQuery) {
          count = { a: 2, b: 7 };
        }

        if (combinedQuery || maleQuery || femaleQuery) {
          return conformAggregations(count);
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
