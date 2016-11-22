import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {ItemList} from '../ItemList';
import {RowList} from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import {I18NLink} from 'app/I18N';

describe('ItemList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      items: [{i: 'item1'}, {i: 'item2'}, {i: 'item3'}],
      link: '/?a=b'
    };
  });

  let render = () => {
    component = shallow(<ItemList {...props} />);
  };

  it('should include all the items inside a RowList element', () => {
    render();
    expect(component.find(RowList).children().length).toBe(3);
    expect(component.find(Doc).at(0).props().doc).toEqual(Immutable(props.items[0]));
    expect(component.find(Doc).at(1).props().doc).toEqual(Immutable(props.items[1]));
    expect(component.find(Doc).at(2).props().doc).toEqual(Immutable(props.items[2]));
  });

  it('should have a button to the Link provided', () => {
    render();
    expect(component.find(I18NLink).props().to).toBe(props.link);
  });
});
