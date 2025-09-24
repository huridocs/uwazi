import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
// @ts-expect-error TS(2307): Cannot find module '../../Library/components/Selec... Remove this comment to see the full error message
import SelectFilter from '../../Library/components/SelectFilter.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/aggregation... Remove this comment to see the full error message
import { Aggregations } from 'shared/types/aggregations.js';
import { PublishedFilters } from '../PublishedFilters';

describe('Published Filter', () => {
  let component: ShallowWrapper<typeof PublishedFilters>;

  const aggregations = {
    all: {
      _published: {
        buckets: [
          { key: 'true', filtered: { doc_count: 8 } },
          { key: 'false', filtered: { doc_count: 2 } },
        ],
      },
    },
  };

  const render = (aggs: Aggregations = aggregations) => {
    component = shallow(<PublishedFilters onChange={() => { }} aggregations={aggs} />);
  };

  it('should display the number of published and restricted entities', () => {
    render();
    const options = component.find(SelectFilter).prop('options');
    expect(options).toEqual([
      expect.objectContaining({ value: 'published', results: 8 }),
      expect.objectContaining({ value: 'restricted', results: 2 }),
    ]);
  });

  describe('when the sum of all aggregations is 0', () => {
    it('should not render anything ', async () => {
      render({
        all: {
          _published: {
            buckets: [
              { key: 'true', filtered: { doc_count: 0 } },
              { key: 'false', filtered: { doc_count: 0 } },
            ],
          },
        },
      });

      expect(component.children().length).toBe(0);
    });
  });
});
