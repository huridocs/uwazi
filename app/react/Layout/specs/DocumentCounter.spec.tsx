import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { DocumentCounter, EntityCounterProps } from 'app/Layout/DocumentCounter';

describe('DocumentCounter', () => {
  let component: ShallowWrapper<typeof DocumentCounter>;
  let props: EntityCounterProps;

  beforeEach(() => {
    props = {
      selectedEntitiesCount: 1,
      entityListCount: 5,
      entityTotal: 100,
      totalConnectionsCount: 3,
      hitsTotalRelation: 'eq',
    };
  });

  const render = () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<DocumentCounter {...props} />);
  };

  describe('relationships content', () => {
    it('should show the relationships count', () => {
      render();
      expect(component.children().get(0).props.children[0]).toBe(3);
      expect(component.children().get(1).props.children).toBe('relationships');
      expect(component.children().get(3).props.children[0].props.children[1]).toBe('100');
      expect(component.children().get(4).props.children).toBe('entities');
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
      expect(component.children().get(6).props.children[1]).toBe('100');
      expect(component.children().get(7).props.children).toBe('entities');
    });

    it('should show a + sign next to the total entities when hitsTotalRelation has the gte flag', () => {
      props.hitsTotalRelation = 'gte';
      render();
      expect(component.text()).toContain('100+');

      delete props.totalConnectionsCount;
      render();
      expect(component.text()).toContain('100+');
    });
  });
});
