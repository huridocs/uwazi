import React, { useRef } from 'react';
import type { FC } from 'react';
import { type DragSourceMonitor } from 'react-dnd';
import { Icon } from 'app/UI';
import type { IDraggable } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { hoverSortable } from './SortFunction';
import { IItemComponentProps } from './Container';

interface DraggableItemProps extends React.PropsWithChildren {
  item: IDraggable;
  useDrag?: Function;
  useDrop?: Function;
  iconHandle?: boolean;
  index: number;
  context: any;
  className?: string;
  omitIcon?: boolean;
}

type DraggedResult = {
  item: IDraggable;
  index: number;
};

const DragableItemComponent: FC<DraggableItemProps> = ({
  item,
  useDrag = () => {},
  useDrop = () => {},
  iconHandle = false,
  index,
  children,
  context,
  className,
  omitIcon = false,
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const [, drop] = useDrop({
    accept: context.type,
    item: { item, index },
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      };
    },
    hover: hoverSortable(ref, index, context.sort),
  });

  const [{ isDragging, handlerId }, drag] = useDrag({
    type: context.type,
    item: { item, index },
    end: (draggedResult: DraggedResult, monitor: DragSourceMonitor) => {
      const { context: dropContext, parent: dropParent } =
        monitor.getDropResult<IItemComponentProps & { parent: IDraggable }>() || {};
      if (
        dropContext !== undefined &&
        (draggedResult.item.container !== item.container ||
          draggedResult.item.container === undefined)
      ) {
        context.addItem(draggedResult.item, dropParent);
      }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;

  drag(drop(ref));
  return (
    <li
      className={`${className} flex flex-row p-3 mt-5 mb-5 border border-gray-200 border-solid min-w-full items-center ${
        iconHandle ? 'cursor-move' : ''
      }`}
      ref={ref}
      data-testid="dragable-item"
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      {!omitIcon && (
        <Icon icon="bars" className={`text-gray-400 ${!iconHandle ? 'cursor-move' : ''}`} />
      )}
      {children}
    </li>
  );
};

const DraggableItem = withDnD(DragableItemComponent);

export { DraggableItem, hoverSortable };
