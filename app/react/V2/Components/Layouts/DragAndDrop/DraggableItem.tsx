import React, { useRef } from 'react';
import type { DragSourceMonitor } from 'react-dnd/dist/types/monitors';
import { Icon } from 'app/UI';
import type { IDraggable } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { IDnDContext } from 'app/V2/CustomHooks';
import { hoverSortable } from './SortFunction';
import { IItemComponentProps } from './Container';

interface DraggableItemProps<T> extends React.PropsWithChildren {
  item: IDraggable<T>;
  useDrag?: Function;
  useDrop?: Function;
  iconHandle?: boolean;
  index: number;
  context: any;
  className?: string;
  omitIcon?: boolean;
}

type DraggedResult<T> = {
  item: IDraggable<T>;
  index: number;
};

function hasValidContext<T>(dropContext?: IDnDContext<T>) {
  return dropContext !== undefined;
}

function isNotAutoContained<T>(
  currentItem: IDraggable<T>,
  draggedResult: DraggedResult<T>,
  dropParent?: { id?: string; item?: IDraggable<T> }
) {
  return (
    (draggedResult.item.container !== currentItem.container ||
      dropParent === undefined ||
      dropParent?.id !== draggedResult.item.parent?.id ||
      draggedResult.item.container === undefined) &&
    (dropParent === undefined || draggedResult.item.id !== dropParent.id)
  );
}

function hasNoItems<T>(currentItem: IDraggable<T>) {
  return currentItem.value.items === undefined || currentItem.value.items.length === 0;
}

const getOpacityLevel = (isDragging: boolean) => (isDragging ? 0.4 : 1);

const getIconHandleClass = (condition: boolean) => (condition ? 'cursor-move' : '');

// eslint-disable-next-line react/function-component-definition
function DraggableItemComponent<T>({
  item,
  useDrag = () => {},
  useDrop = () => {},
  iconHandle = false,
  index,
  children,
  context,
  className,
  omitIcon = false,
}: DraggableItemProps<T>) {
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
    end: (draggedResult: DraggedResult<T>, monitor: DragSourceMonitor) => {
      const { context: dropContext, parent: dropParent } =
        monitor.getDropResult<IItemComponentProps<T> & { parent: IDraggable<T> }>() || {};
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
      data-testid={`${
        item.container || (item.parent && context.getDisplayName(item.parent)) || 'available'
      }-draggable-item-${index}`}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      {!omitIcon && (
        <Icon icon="bars" className={`text-gray-400 ${getIconHandleClass(!iconHandle)}`} />
      )}
      {children}
    </li>
  );
}

const DraggableItem = withDnD(DraggableItemComponent);

export { DraggableItem, hoverSortable };
