import { shallow } from 'enzyme';
import React from 'react';
import { DocumentCounter } from 'app/Layout/DocumentCounter';

describe('DocumentCounter', () => {
  let component: any;
  const props = {
    selectedEntitiesCount: 1,
    entityListCount: 5,
    entityTotal: 100,
    totalConnectionsCount: 3,
  };
  const render = () => {
    component = shallow(<DocumentCounter {...props} />);
  };
  describe('connections content', () => {
    it('should show the connections count', () => {
      render();
      expect(component.children().get(0).props.children[0]).toBe(3);
      expect(component.children().get(1).props.children).toBe('connections');
      expect(component.children().get(3).props.children[0]).toBe(100);
      expect(component.children().get(4).props.children).toBe('documents');
    });
  });
  describe('entities content', () => {
    it('should show the number of selected, shown and total entities', () => {
      delete props.totalConnectionsCount;
      render();
      expect(component.children().get(0).props.children[1]).toBe(1);
      expect(component.children().get(2).props.children).toBe('selected of');
      expect(component.children().get(3).props.children[1]).toBe(5);
      expect(component.children().get(5).props.children).toBe('shown of');
      expect(component.children().get(6).props.children[1]).toBe(100);
      expect(component.children().get(8).props.children).toBe('documents');
    });
  });
});
