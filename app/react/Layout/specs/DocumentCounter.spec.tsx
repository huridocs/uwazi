<<<<<<< HEAD
/**
 * @jest-environment jsdom
 */
import { DocumentCounter, EntityCounterProps } from 'app/Layout/DocumentCounter';
import { renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';

describe('DocumentCounter', () => {
  let component: any;
  const defaultProps = {
    selectedEntitiesCount: 1,
    entityListCount: 5,
    entityTotal: 100,
    totalConnectionsCount: 3,
    hiddenConnectionsCount: 0,
  };
  const render = (args?: Partial<EntityCounterProps>) => {
    const props = { ...defaultProps, ...args };
    component = renderConnectedMount(DocumentCounter, {}, props, true);
=======
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
>>>>>>> feature/access-levels
  };

  describe('connections content', () => {
    it('should show the connections count', () => {
      render();
<<<<<<< HEAD
      expect(component.text()).toBe('3 connections, 100 documents');
    });

    it('should show the number of hidden connections if there is any', () => {
      render({ hiddenConnectionsCount: 2 });
      expect(component.text()).toBe(
        // eslint-disable-next-line max-len
        '1 connections (2 hidden You don’t have rights to see these entities. To see them, someone from the organization has to share them with you.), 100 documents'
      );
=======
      expect(component.children().get(0).props.children[0]).toBe(3);
      expect(component.children().get(1).props.children).toBe('connections');
      expect(component.children().get(3).props.children[1]).toBe('100');
      expect(component.children().get(4).props.children).toBe('documents');
>>>>>>> feature/access-levels
    });
  });

  describe('entities content', () => {
    it('should show the number of selected, shown and total entities', () => {
      delete defaultProps.totalConnectionsCount;
      render();
<<<<<<< HEAD
      expect(component.text()).toBe(' 1  selected of 5  shown of 100  documents');
=======
      expect(component.children().get(0).props.children[1]).toBe(1);
      expect(component.children().get(2).props.children).toBe('selected of');
      expect(component.children().get(3).props.children[1]).toBe(5);
      expect(component.children().get(5).props.children).toBe('shown of');
      expect(component.children().get(6).props.children[1]).toBe('100');
      expect(component.children().get(7).props.children).toBe('documents');
    });

    it('should show a + sign next to the total entities when hitsTotalRelation has the gte flag', () => {
      props.hitsTotalRelation = 'gte';
      render();
      expect(component.text()).toContain('100+');

      delete props.totalConnectionsCount;
      render();
      expect(component.text()).toContain('100+');
>>>>>>> feature/access-levels
    });
  });
});
