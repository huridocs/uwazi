import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
// @ts-expect-error TS(2307): Cannot find module '../../Library/components/Selec... Remove this comment to see the full error message
import SelectFilter from '../../Library/components/SelectFilter.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/aggregation... Remove this comment to see the full error message
import { Aggregations } from 'shared/types/aggregations.js';
import { FilterTocGeneration } from '../FilterTocGeneration';

describe('FilterTocGeneration', () => {
  let component: ShallowWrapper<typeof FilterTocGeneration>;
  const aggregations = {
    all: {
      generatedToc: {
        buckets: [
          { key: 'false', filtered: { doc_count: 2 } },
          { key: 'true', filtered: { doc_count: 5 } },
        ],
      },
    },
  };

  const render = (aggs: Aggregations = aggregations) => {
    component = shallow(<FilterTocGeneration onChange={() => { }} aggregations={aggs} />);
  };

  it('should render nothing if file generatedToc is false', () => {
    render();
    const options = component.find(SelectFilter).prop('options');
    expect(options).toEqual([
      expect.objectContaining({ value: true, results: 5 }),
      expect.objectContaining({ value: false, results: 2 }),
    ]);
  });

  describe('when there is bucket missing', () => {
    it('should not fail (render blank state)', () => {
      render({
        all: {
          generatedToc: {
            buckets: [{ key: 'false', filtered: { doc_count: 2 } }],
          },
        },
      });
      const options = component.find(SelectFilter).prop('options');
      expect(options).toEqual([
        expect.objectContaining({ value: true, results: 0 }),
        expect.objectContaining({ value: false, results: 2 }),
      ]);
    });
  });

  describe('when aggregations are not defined/complete', () => {
    it('should not fail (render blank state)', () => {
      //@ts-ignore
      render({});
      let options = component.find(SelectFilter).prop('options');
      expect(options).toEqual([
        expect.objectContaining({ value: true, results: 0 }),
        expect.objectContaining({ value: false, results: 0 }),
      ]);

      render({ all: {} });
      options = component.find(SelectFilter).prop('options');
      expect(options).toEqual([
        expect.objectContaining({ value: true, results: 0 }),
        expect.objectContaining({ value: false, results: 0 }),
      ]);
    });
  });
});
