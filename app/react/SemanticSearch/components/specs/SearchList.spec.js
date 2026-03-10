import React from 'react';
import { shallow } from 'enzyme';
import { SearchListComponent as SearchList } from '../SearchList';

describe('SearchList', () => {
  let searches;
  beforeEach(() => {
    searches = [
      {
        _id: 'id1',
        searchTerm: 'query',
        documents: [],
        status: 'completed',
      },
      {
        _id: 'id2',
        searchTerm: 'query',
        documents: [],
        status: 'completed',
      },
    ];
  });

  const getProps = () => ({ searches });

  const render = () => shallow(<SearchList {...getProps()} />);

  it('should render list of SearchItem with specified searches', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });
});
