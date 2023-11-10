/* eslint-disable import/exports-last */
import React, { PropsWithChildren } from 'react';
import type { DropTargetMonitor } from 'react-dnd/dist/types/monitors';
import { Translate } from 'app/I18N';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { withDnD } from '../../componentWrappers';

interface DroppableProps<T> extends PropsWithChildren {
  name: string;
  type: ItemTypes;
  context: any;
  useDrop?: Function;
  parent?: IDraggable<T>;
  wrapperType?: 'tbody' | 'div' | 'tr';
  className?: string;
  activeClassName?: string;
}

/* eslint-disable comma-spacing */
const DropZoneComponent = <T,>({
  name,
  useDrop = () => {},
  type,
  context,
  parent,
  children,
  wrapperType = 'div',
  className,
  activeClassName,
}: DroppableProps<T>) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: () => ({ name, context, parent }),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;

  const dropClassName = isActive
    ? activeClassName ||
      ' bg-bray-800 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'
    : className ||
      'flex flex-col items-center justify-center  text-gray-400 uppercase p-15 h-14 text-base m-5 border border-gray-300 border-dashed rounded-sm cursor-pointer bg-gray-50';

  const TagName = wrapperType;
  return (
    <TagName ref={drop} className={dropClassName} data-testid={name}>
      {children || <Translate>Drag items here</Translate>}
    </TagName>
  );
};
const DropZone = withDnD(DropZoneComponent);
export { DropZone };
