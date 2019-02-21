import React from 'react';
import { shallow } from 'enzyme';
import { DragAndDropContainer, containerTarget } from '../DragAndDropContainer';
import DragAndDropItem from '../DragAndDropItem';

describe('DragAndDropContainer', () => {
  describe('react component', () => {
    let component;
    let props;
    let items;
    beforeEach(() => {
      items = [
        { content: 'A rude awakening', id: 1 },
        { content: 'A nice awakening', id: 2 }
      ];
      props = {
        connectDropTarget: jasmine.createSpy('connectDropTarget').and.callFake(value => value),
        items,
        onChange: jasmine.createSpy('onChange')
      };
    });

    const render = () => {
      component = shallow(<DragAndDropContainer {...props} />);
    };

    it('should render a DragAndDropItem for each item', () => {
      render();
      expect(component.find(DragAndDropItem).length).toBe(2);
      expect(component.find(DragAndDropItem).first().props().children).toBe('A rude awakening');
    });

    describe('accepts a custom render function', () => {
      it('to render items', () => {
        props.renderItem = () => <span>Avocado</span>;
        render();
        expect(component.find(DragAndDropItem).first().find('span').text()).toBe('Avocado');
      });
    });

    describe('when an item moves', () => {
      it('should reorder the items and call onChange', () => {
        render();
        component.instance().moveItem(1, 0, items[1]);
        expect(props.onChange).toHaveBeenCalledWith([{ content: 'A nice awakening', id: 2 }, { content: 'A rude awakening', id: 1 }]);
      });

      describe('when the item does not belong to the container', () => {
        it('should do nothing', () => {
          render();
          component.instance().moveItem(1, 0, { id: 27 });
          expect(props.onChange).not.toHaveBeenCalled();
        });
      });
    });

    describe('removeItem', () => {
      it('should remove the item and call onChange', () => {
        render();
        component.instance().removeItem(1);
        expect(props.onChange).toHaveBeenCalledWith([{ content: 'A nice awakening', id: 2 }]);
      });
    });
  });

  describe('containerTarget', () => {
    describe('drop', () => {
      it('should return the container id', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => {}
        };

        const component = { state: { id: 'container_id' } };
        const props = {
          items: [{ id: 1 }],
          onChange: jasmine.createSpy('onChange')
        };
        const dropResult = containerTarget.drop(props, monitor, component);
        expect(dropResult).toEqual({ id: 'container_id' });
        expect(props.onChange).not.toHaveBeenCalled();
      });

      it('should add the item if missing', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => {}
        };
        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange')
        };
        containerTarget.drop(props, monitor, component);
        expect(props.onChange).toHaveBeenCalledWith([{ id: 1 }]);
      });

      it('should NOT add the item if other container handles the drop', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => ({ id: 'I_handle_this' })
        };
        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange')
        };
        containerTarget.drop(props, monitor, component);
        expect(props.onChange).not.toHaveBeenCalled();
      });
    });
  });
});
