import React, { useRef } from 'react';
import type { FC } from 'react';
import type { DragSourceMonitor } from 'react-dnd/dist/types/monitors';
import { Icon } from 'app/UI';
import type { IDraggable } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { IDnDContext } from 'app/V2/CustomHooks';
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

const hasValidContext = (dropContext?: IDnDContext) => dropContext !== undefined;

const isNotAutoContained = (
  currentItem: IDraggable,
  draggedResult: DraggedResult,
  dropParent?: { id?: string; item?: IDraggable }
) =>
  (draggedResult.item.container !== currentItem.container ||
    dropParent === undefined ||
    dropParent?.id !== draggedResult.item.parent?.id ||
    draggedResult.item.container === undefined) &&
  (dropParent === undefined || draggedResult.item.id !== dropParent.id);

const hasNoItems = (currentItem: IDraggable) =>
  currentItem.items === undefined || currentItem.items.length === 0;

const getOpacityLevel = (isDragging: boolean) => (isDragging ? 0.4 : 1);

const getIconHandleClass = (condition: boolean) => (condition ? 'cursor-move' : '');

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
    hover: hoverSortable(ref, item, index, context.sort),
  });

  const [{ isDragging, handlerId }, drag] = useDrag({
    type: context.type,
    item: { item, index },
    end: (draggedResult: DraggedResult, monitor: DragSourceMonitor) => {
      const { context: dropContext, parent: dropParent } =
        monitor.getDropResult<IItemComponentProps & { parent: IDraggable }>() || {};
      if (
        hasValidContext(dropContext) &&
        isNotAutoContained(item, draggedResult, dropParent) &&
        hasNoItems(item)
      ) {
        context.addItem(draggedResult.item, dropParent);
      }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
      handlerId: monitor.getHandlerId(),
    }),
  });

  const opacity = getOpacityLevel(isDragging);

  drag(drop(ref));
  return (
    <li
      className={`${className} flex flex-row pl-3 mt-2 mb-2 border border-gray-200 border-solid min-w-full items-center ${getIconHandleClass(
        iconHandle
      )}`}
      ref={ref}
      data-testid={`${item.container || item.parent?.name || 'available'}-draggable-item-${index}`}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      {!omitIcon && (
        <Icon icon="bars" className={`text-gray-400 ${getIconHandleClass(!iconHandle)}`} />
      )}
      {children}
    </li>
  );
};

const DraggableItem = withDnD(DragableItemComponent);

export { DraggableItem, hoverSortable };
