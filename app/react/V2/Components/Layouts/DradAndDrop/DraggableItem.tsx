import React, { useRef } from 'react';
import type { FC, RefObject } from 'react';
import { type DragSourceMonitor, type XYCoord } from 'react-dnd';
import { withDnD } from 'app/componentWrappers';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDraggable } from 'app/V2/shared/types';

import { Icon } from 'app/UI';

interface DraggableItemProps {
  name: string;
  useDrag?: Function;
  useDrop?: Function;
  iconHandle: boolean;
  type: ItemTypes;
  index: number;
  sortLink: Function;
  addCard: Function;
}

interface DropResult {
  name: string;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const hoverSortable =
  (ref: RefObject<HTMLElement>, index: number, sortFunction: Function) =>
  (item: DragItem, monitor: any) => {
    if (!ref.current) {
      return;
    }
    const dragIndex = item.index;
    const hoverIndex = index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = ref.current?.getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    sortFunction(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    item.index = hoverIndex;
  };

const DragableItemComponent: FC<DraggableItemProps> = ({
  name,
  useDrag = () => {},
  useDrop = () => {},
  iconHandle,
  index,
  sortLink,
  type,
  addCard,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId: handlerId1 }, drop] = useDrop({
    accept: type,
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    end: () => {
      console.log('ended');
    },
    hover: hoverSortable(ref, index, sortLink),
  });

  const [{ isDragging, handlerId }, drag] = useDrag(() => ({
    type,
    item: { name, index, sortLink },
    end: (item: IDraggable, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult && dropResult.addCard && !item.sortLink) {
        console.log(item);
        dropResult.addCard(item);
      }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;

  let propertyClass = 'list-group-item';
  if (isDragging) {
    propertyClass += ' dragging';
  }

  if (!iconHandle) {
    propertyClass += ' draggable';
  }
  drag(drop(ref));

  return (
    <div
      className={propertyClass}
      ref={ref}
      data-testid="dragable-item"
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      {iconHandle && (
        <span className="draggable" ref={null}>
          <Icon icon="bars" />
        </span>
      )}
      {!iconHandle && <Icon icon="bars" />}
      {name}
    </div>
  );
};

const DraggableItem = withDnD(DragableItemComponent);
export { DraggableItem };
export { hoverSortable };
