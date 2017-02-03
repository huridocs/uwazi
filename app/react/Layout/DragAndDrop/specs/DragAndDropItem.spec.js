import React from 'react';
import {shallow} from 'enzyme';
import {DragAndDropItem} from '../DragAndDropItem';

describe('DragAndDropItem', () => {
  describe('react component', () => {
    let component;
    let props;
    beforeEach(() => {
      props = {
        connectDragSource: jasmine.createSpy('connectDragSource').and.callFake((value) => value),
        connectDropTarget: jasmine.createSpy('connectDropTarget').and.callFake((value) => value),
        index: 1,
        isDragging: false,
        id: 1,
        moveItem: jasmine.createSpy('moveItem')
      };
    });

    let render = () => {
      component = shallow(<DragAndDropItem {...props} />);
    };

    it('should connect the component to the dragSource and dragTarget', () => {
      render();
      expect(props.connectDragSource).toHaveBeenCalled();
      expect(props.connectDropTarget).toHaveBeenCalled();
    });

    describe('when is dragging', () => {
      it('shiould add the class dragging to it', () => {
        props.isDragging = true;
        render();
        expect(component.find('div').hasClass('dragging')).toBe(true);
      });
    });
  });
});
