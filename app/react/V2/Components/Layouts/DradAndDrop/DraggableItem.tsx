import React from 'react';
import type { FC } from 'react';
import type { DragSourceMonitor } from 'react-dnd';
import { withDnD } from 'app/componentWrappers';
import { ItemTypes } from 'app/V2/shared/types';
import type { IDragable } from 'app/V2/shared/types';
import { Icon } from 'app/UI';

// const style: CSSProperties = {
//   cursor: 'move',
//   float: 'left',
// };

interface DragableItemProps {
  name: string;
  useDrag: Function;
  iconHandle: string;
  type: typeof ItemTypes;
}

interface DropResult {
  name: string;
}

const DragableItem1: FC<DragableItemProps> = ({ name, useDrag, iconHandle, type }) => {
  const [{ isDragging, handlerId }, drag] = useDrag(() => ({
    type,
    item: { name },
    end: (item: IDragable, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (item && dropResult) {
        alert(`You dropped ${item.name} into ${dropResult.name}!`);
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

  return (
    <div
      className={propertyClass}
      ref={drag}
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

const DragableItem = withDnD(DragableItem1);
export { DragableItem };
