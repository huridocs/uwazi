import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as Immutable } from 'immutable';

import { RowList } from 'app/Layout/Lists';
import { I18NLink } from 'app/I18N';
import { ItemList } from '../ItemList';
import Slider from '../slider';

describe('ItemList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      items: [{ i: 'item1' }, { i: 'item2' }, { i: 'item3' }],
      options: {},
      link: '/?a=b',
    };
  });

  const render = () => {
    component = shallow(<ItemList {...props} />);
  };

  describe('when options slider = true', () => {
    it('should include all the items inside a RowList > Slider element', () => {
      props.options = { slider: true };
      render();
      const docs = component.find(RowList).children(Slider).at(0).children();
      expect(component.find(RowList).children(Slider).at(0).children().length).toBe(3);
      expect(docs.at(0).props().doc).toEqual(Immutable(props.items[0]));
      expect(docs.at(1).props().doc).toEqual(Immutable(props.items[1]));
      expect(docs.at(2).props().doc).toEqual(Immutable(props.items[2]));
    });
  });

  it('should include all the items inside a RowList element', () => {
    render();
    expect(component.find(RowList).children().length).toBe(3);
    const docs = component.find(RowList).children();
    expect(docs.at(0).props().doc).toEqual(Immutable(props.items[0]));
    expect(docs.at(1).props().doc).toEqual(Immutable(props.items[1]));
    expect(docs.at(2).props().doc).toEqual(Immutable(props.items[2]));
  });

  it('should pass the list search params as searchParams to the Doc', () => {
    props.link = '/es/?sort=sortProperty';
    render();
    expect(component.find(RowList).children().at(0).props().searchParams).toEqual({
      sort: 'sortProperty',
    });
  });

  it('should default to sort: titel if no searchParams on link', () => {
    render();
    expect(component.find(RowList).children().at(0).props().searchParams).toEqual({
      sort: 'title',
    });
  });

  it('should have a button to the Link provided', () => {
    render();
    expect(component.find(I18NLink).props().to).toBe(props.link);
  });
});
