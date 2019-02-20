import React from 'react';

import { shallow } from 'enzyme';

import { SearchItem } from '../SearchItem';

describe('SearchItem', () => {
  let search;
  beforeEach(() => {
    search = {
      _id: 'id',
      searchTerm: 'query',
      documents: [],
      status: 'completed'
    };
  });

  const getProps = () => ({ search });

  const render = () => shallow(<SearchItem {...getProps()} />);

  it('should render search details and progress with link to results page ', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('when search status is inProgress', () => {
    it('should render in-progress icon and stop button', () => {
      search.status = 'inProgress';
      const component = render();
      expect(component).toMatchSnapshot();
    });
  });
});
