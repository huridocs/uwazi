import React from 'react';

import { shallow } from 'enzyme';

import List from '../List';
import Context from '../Context';

describe('List', () => {
  let props;
  beforeEach(() => {
    props = {
      data: ['Batman', 'Spiderman']
    };
  });

  it('should render the items in data using the given html', () => {
    const component = shallow(
      <List {...props}>
        <span>Name: <Context/></span>
      </List>
    );
    expect(component).toMatchSnapshot();
  });
});
