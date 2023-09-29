import React from 'react';
import { shallow } from 'enzyme';
import { mockID } from 'shared/uniqueID';
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
        { content: 'A nice awakening', id: 2 },
      ];
      props = {
        connectDropTarget: jasmine.createSpy('connectDropTarget').and.callFake(value => value),
        items,
        onChange: jasmine.createSpy('onChange'),
      };
      mockID();
    });

    const render = () => {
      component = shallow(<DragAndDropContainer {...props} />);
    };

    it('should render a DragAndDropItem for each item', () => {
      render();
      expect(component.find(DragAndDropItem).length).toBe(2);
      expect(component.find(DragAndDropItem).first().props().originalItem).toEqual(items[0]);
      expect(component.find(DragAndDropItem).first().props().children(items[0])).toBe(
        'A rude awakening'
      );
    });

    it('should enable iconHandle on children if iconHandle is enabled in container', () => {
      props.iconHandle = true;
      render();
      expect(component).toMatchSnapshot();
    });

    it('should enable iconHandle for child that has nested items property', () => {
      items[0].items = [{ id: 3, content: 'sub item' }];
      render();
      expect(component).toMatchSnapshot();
    });

    describe('accepts a custom render function', () => {
      beforeEach(() => {
        props.renderItem = jest.fn().mockImplementation((item, index) => (
          <span>
            Avocado {item.content} {index}
          </span>
        ));
      });
      it('to render items', () => {
        render();
        component.instance().renderItem(items[0], 0);
        expect(props.renderItem).toHaveBeenCalledWith(items[0], 0);
      });
    });

    describe('when an item moves', () => {
      it('should reorder the items and call onChange', () => {
        render();
        component.instance().moveItem(1, 0, items[1]);
        expect(props.onChange).toHaveBeenCalledWith([
          { content: 'A nice awakening', id: 2 },
          { content: 'A rude awakening', id: 1 },
        ]);
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
          getDropResult: () => {},
        };

        const component = { state: { id: 'container_id' } };
        const props = {
          items: [{ id: 1 }],
          onChange: jasmine.createSpy('onChange'),
        };
        const dropResult = containerTarget.drop(props, monitor, component);
        expect(dropResult).toEqual({ id: 'container_id' });
        expect(props.onChange).not.toHaveBeenCalled();
      });

      it('should add the item if missing', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => {},
        };
        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange'),
        };
        containerTarget.drop(props, monitor, component);
        expect(props.onChange).toHaveBeenCalledWith([{ id: 1 }]);
      });

      it('should NOT add the item if other container handles the drop', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => ({ id: 'I_handle_this' }),
        };
        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange'),
        };
        containerTarget.drop(props, monitor, component);
        expect(props.onChange).not.toHaveBeenCalled();
      });
    });
  });
});
