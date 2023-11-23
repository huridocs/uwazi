import React, { RefObject, useEffect, useRef } from 'react';
import type { DragSourceMonitor } from 'react-dnd/dist/types/monitors';
import { Bars3Icon } from '@heroicons/react/20/solid';

import type { IDraggable } from 'app/V2/shared/types';
import { hoverSortable } from './SortFunction';
import { IItemComponentProps } from './Container';
import type { IDnDContext } from './DnDDefinitions';
import { withDnD } from '../../componentWrappers';

interface DraggableItemProps<T> extends React.PropsWithChildren {
  item: IDraggable<T>;
  useDrag?: Function;
  useDrop?: Function;
  iconHandle?: boolean;
  index: number;
  context: any;
  className?: string;
  omitIcon?: boolean;
  wrapperType?: 'li' | 'tr' | 'div';
  container?: string;
  previewRef?: RefObject<HTMLElement>;
}

type DraggedResult<T> = {
  item: IDraggable<T>;
  index: number;
  container: string;
};

/* eslint-disable comma-spacing */
const hasValidContext = <T,>(dropContext?: IDnDContext<T>) => dropContext !== undefined;

/* eslint-disable comma-spacing */
const isNotAutoContained = <T,>(
  currentItem: IDraggable<T>,
  draggedResult: DraggedResult<T>,
  dropParent?: { id?: string; item?: IDraggable<T> }
) =>
  (draggedResult.item.container !== currentItem.container ||
    dropParent === undefined ||
    dropParent?.id !== draggedResult.item.parent?.id ||
    draggedResult.item.container === undefined) &&
  (dropParent === undefined || draggedResult.item.id !== dropParent.id);

/* eslint-disable comma-spacing */
const hasNoItems = <T,>(currentItem: IDraggable<T>) =>
  currentItem.value.items === undefined || currentItem.value.items.length === 0;

const getOpacityLevel = (isDragging: boolean) => (isDragging ? 0 : 1);

const getIconHandleClass = (condition: boolean) => (condition ? 'cursor-move' : '');

/* eslint-disable comma-spacing */
const elementTestId = <T,>(
  item: IDraggable<T>,
  context: any,
  container: string | undefined,
  index: number
) =>
  `${
    (item.parent ? `group_${context.getDisplayName(item.parent)}` : '') || container || 'available'
  }-draggable-item-${index}`;

/* eslint-disable comma-spacing */
// eslint-disable-next-line max-statements
const DraggableItemComponent = <T,>({
  item,
  useDrag = () => {},
  useDrop = () => {},
  iconHandle = false,
  index,
  children,
  context,
  className,
  omitIcon = false,
  wrapperType = 'li',
  container,
  previewRef,
}: DraggableItemProps<T>) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: context.type,
    item: { item: { ...item, container }, container, index },
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
        offSet: monitor.getClientOffset(),
      };
    },
    hover: hoverSortable(ref, { ...item, container }, index, context.sort),
  });

  const [{ isDragging, handlerId }, drag, preview] = useDrag({
    type: context.type,
    item: { item: { ...item, container }, index },
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

  const previewReference = previewRef || ref;

  useEffect(() => {
    preview(previewReference);
  }, [preview, previewReference]);

  const opacity = getOpacityLevel(isDragging);

  if (previewReference && previewReference.current) {
    // eslint-disable-next-line no-param-reassign
    previewReference.current.style.opacity = getOpacityLevel(isDragging).toString();
  }

  drag(ref);
  drop(previewReference);
  drop(ref);

  const TagName = wrapperType;

  return (
    <TagName
      className={`${
        className ||
        'flex flex-row pl-3 mt-2 mb-2 border border-gray-200 border-solid min-w-full items-center'
      }  ${getIconHandleClass(iconHandle)} `}
      ref={ref}
      data-testid={elementTestId<T>(item, context, container, index)}
      style={{ opacity }}
      data-handler-id={handlerId}
      key={TagName + item.id}
    >
      {!omitIcon && wrapperType === 'li' && (
        <Bars3Icon className={`w-4 text-gray-400 ${getIconHandleClass(!iconHandle)}`} />
      )}
      {children}
    </TagName>
  );
};

const DraggableItem = withDnD(DraggableItemComponent);

export { DraggableItem, hoverSortable };
