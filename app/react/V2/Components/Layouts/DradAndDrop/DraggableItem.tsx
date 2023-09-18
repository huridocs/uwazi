import React, { useRef } from 'react';
import type { FC, RefObject } from 'react';
import { type DragSourceMonitor, type XYCoord } from 'react-dnd';
import { Icon } from 'app/UI';
import type { ItemTypes, IDraggable } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';

interface DraggableItemProps extends React.PropsWithChildren {
  item: IDraggable;
  useDrag?: Function;
  useDrop?: Function;
  iconHandle?: boolean;
  type: ItemTypes;
  index: number;
  sortLink?: Function;
  className: string;
}

interface DropResult {
  item: string;
  onDrop: Function;
}
const hoverSortable =
  (ref: RefObject<HTMLElement>, index: number, sortFunction?: Function) =>
  // eslint-disable-next-line max-statements
  (
    currentItem: {
      index: number;
      id: string;
      type: string;
    },
    monitor: any
  ) => {
    if (!ref.current || !sortFunction || !monitor.isOver({ shallow: true })) {
      return;
    }

    const dragIndex = currentItem.index;
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
    // eslint-disable-next-line no-param-reassign
    currentItem.index = hoverIndex;
  };

const DragableItemComponent: FC<DraggableItemProps> = ({
  item,
  useDrag = () => {},
  useDrop = () => {},
  iconHandle = false,
  index,
  sortLink,
  type,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: type,
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover: hoverSortable(ref, index, sortLink),
  });

  const [{ isDragging, handlerId }, drag] = useDrag(() => ({
    type,
    item: { item, index, sortLink },
    end: (draggedItem: IDraggable, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (draggedItem && dropResult && dropResult.onDrop) {
        dropResult.onDrop(item);
      }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;

  drag(drop(ref));
  return (
    <div
      className={`${className} flex flex-row p-3 m-5 border border-gray-200 border-solid ${
        iconHandle ? 'cursor-move' : ''
      }`}
      ref={ref}
      data-testid="dragable-item"
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <Icon icon="bars" className={`text-gray-400 ${!iconHandle ? 'cursor-move' : ''}`} />
      {children}
    </div>
  );
};

const DraggableItem = withDnD(DragableItemComponent);

export { DraggableItem, hoverSortable };
