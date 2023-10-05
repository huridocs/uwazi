import { RefObject } from 'react';
import type { XYCoord } from 'react-dnd/dist/types/monitors';
import { IDraggable } from 'app/V2/shared/types';

const exitSorting = (
  ref: RefObject<HTMLElement>,
  monitor: any,
  dragIndex: number,
  hoverIndex: number
) => {
  // Determine rectangle on screen
  const hoverBoundingRect = ref.current?.getBoundingClientRect();

  // No hoverBoundingRect AND Don't replace items with themselves
  if (hoverBoundingRect === undefined || dragIndex === hoverIndex) {
    return true;
  }

  // Get vertical middle
  const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

  // Determine mouse position
  const clientOffset = monitor.getClientOffset();

  // Get pixels to the top
  const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

  // Only perform the move when the mouse has crossed half of the items height
  // When dragging downwards, only move when the cursor is below 50%
  // When dragging upwards, only move when the cursor is above 50%

  // Dragging downwards OR Dragging upwards
  if (
    (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) ||
    (dragIndex > hoverIndex && hoverClientY > hoverMiddleY)
  ) {
    return true;
  }
  return false;
};

const hoverSortable =
  (ref: RefObject<HTMLElement>, target: IDraggable, index: number, sortFunction?: Function) =>
  (
    currentItem: {
      index: number;
      id: string;
      type: string;
      item: IDraggable;
    },
    monitor: any
  ) => {
    if ((currentItem.item.parent && !target.parent) || currentItem.id === target.id) {
      return;
    }

    const dragIndex = currentItem.index;
    const hoverIndex = index;
    if (
      !ref.current ||
      !sortFunction ||
      !monitor.isOver({ shallow: true }) ||
      currentItem.item.container === undefined ||
      exitSorting(ref, monitor, dragIndex, hoverIndex)
    ) {
      return;
    }
    // Time to actually perform the action
    sortFunction(currentItem.item, target, dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    // eslint-disable-next-line no-param-reassign
    currentItem.index = hoverIndex;
  };

export { hoverSortable };
