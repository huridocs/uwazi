import React from 'react';
import {shallow} from 'enzyme';

import {ItemList} from '../ItemList';
import {RowList} from 'app/Layout/Lists';
import {Link} from 'react-router';
import Doc from 'app/Library/components/Doc';

describe('ItemList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      items: ['item1', 'item2', 'item3'],
      link: '/?a=b'
    };
  });

  let render = () => {
    component = shallow(<ItemList {...props} />);
  };

  it('should include all the items inside a RowList element', () => {
    render();
    expect(component.find(RowList).children().length).toBe(3);
    expect(component.find(Doc).at(0).props().doc).toBe(props.items[0]);
    expect(component.find(Doc).at(1).props().doc).toBe(props.items[1]);
    expect(component.find(Doc).at(2).props().doc).toBe(props.items[2]);
  });

  it('should have a button to the Link provided', () => {
    render();
    expect(component.find(Link).props().to).toBe(props.link);
  });
});
