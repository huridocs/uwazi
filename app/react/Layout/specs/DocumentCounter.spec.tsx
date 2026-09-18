import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { DocumentCounter, EntityCounterProps } from '#app/Layout/DocumentCounter.js';
import { enzymeEl } from '#app/utils/test/renderConnected.js';

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
      const child = (i: number) => enzymeEl(component.children().get(i)).props.children;
      expect((child(0) as unknown[])[0]).toBe(3);
      expect(child(1)).toBe('relationships');
      expect((enzymeEl((child(3) as unknown[])[0]).props.children as unknown[])[1]).toBe('100');
      expect(child(4)).toBe('entities');
    });
  });

  describe('entities content', () => {
    it('should show the number of selected, shown and total entities', () => {
      delete props.totalConnectionsCount;
      render();
      const child = (i: number) => enzymeEl(component.children().get(i)).props.children;
      expect((child(0) as unknown[])[1]).toBe(1);
      expect(child(2)).toBe('selected of');
      expect((child(3) as unknown[])[1]).toBe(5);
      expect(child(5)).toBe('shown of');
      expect((child(6) as unknown[])[1]).toBe('100');
      expect(child(7)).toBe('entities');
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
