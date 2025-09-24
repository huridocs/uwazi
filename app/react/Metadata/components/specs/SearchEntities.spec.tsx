import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../Layout/SearchInput.js' o... Remove this comment to see the full error message
import SearchInput from '../../Layout/SearchInput.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/tsUtils.js' or it... Remove this comment to see the full error message
import { sleep } from 'shared/tsUtils.js';
// @ts-expect-error TS(2307): Cannot find module '../../Search/SearchAPI.js' or ... Remove this comment to see the full error message
import SearchApi from '../../Search/SearchAPI.js';
import { SearchEntities, SearchEntitiesProps, SearchEntitiesState } from '../SearchEntities.js';

// @ts-expect-error TS(2307): Cannot find module '../../Connections/components/S... Remove this comment to see the full error message
import SearchResults from '../../Connections/components/SearchResults.js';

describe('SearchEntities', () => {
  let component: ShallowWrapper<SearchEntitiesProps, SearchEntitiesState, SearchEntities>;
  let props: SearchEntitiesProps;

  beforeEach(() => {
    props = {
      onSelect: jasmine.createSpy('onSelect'),
      onFinishSearch: jasmine.createSpy('onFinishedSearch'),
    };
    spyOn(SearchApi, 'search').and.returnValue(
      Promise.resolve({
        rows: [
          {
            title: 'test',
          },
        ],
      })
    );
  });

  const render = () => {
    component = shallow(<SearchEntities {...props} />);
  };

  describe('search', () => {
    it('should request for the entities matching by title', async () => {
      render();
      component.find(SearchInput).simulate('change', { target: { value: 'test' } });
      await sleep(401);
      expect(SearchApi.search).toHaveBeenLastCalledWith({
        data: { fields: ['title'], includeUnpublished: true, searchTerm: 'test' },
        headers: {},
      });
      expect(props.onFinishSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('when clicking a result', () => {
    it('should call onSelect with the entity', async () => {
      render();
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      const click = component.find(SearchResults).props().onClick;
      const expectedEntity = { sharedId: '1234', title: '44' };
      click('1234', expectedEntity);
      expect(props.onSelect).toHaveBeenLastCalledWith(expectedEntity);
    });
  });

  describe('when initial search provided', () => {
    it('should should request for the entities after mounting', async () => {
      component = shallow(<SearchEntities {...{ ...props, initialSearchTerm: 'test' }} />);
      expect(SearchApi.search).toHaveBeenLastCalledWith({
        data: { fields: ['title'], includeUnpublished: true, searchTerm: 'test' },
        headers: {},
      });
    });
  });
});
