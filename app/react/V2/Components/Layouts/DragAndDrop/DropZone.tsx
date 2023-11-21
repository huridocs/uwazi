import React, { PropsWithChildren, RefObject, useRef } from 'react';
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
  innerRef?: RefObject<HTMLElement>;
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
  innerRef,
}: DroppableProps<T>) => {
  const ref = useRef(null);
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: () => ({ name, context, parent }),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;

  const classesByTag: { [k: string]: string } = {
    div:
      className ||
      'flex flex-col items-center justify-center  text-gray-400 uppercase p-15 h-14 text-base m-5 border border-gray-300 border-dashed rounded-sm cursor-pointer bg-gray-50',
    tr: className || '',
    'active-div':
      activeClassName ||
      ' bg-gray-800 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600',
    'active-tr': activeClassName || '',
  };

  const baseClassName = classesByTag[wrapperType] || '';
  const activeClasses = classesByTag[`active-${wrapperType}`] || '';
  const dropClassName = isActive ? baseClassName + activeClasses : className || baseClassName;

  const TagName = wrapperType;

  return (
    <TagName ref={drop(innerRef || ref)} className={dropClassName} data-testid={name}>
      {children || <Translate>Drag items here</Translate>}
    </TagName>
  );
};
const DropZone = withDnD(DropZoneComponent);
export { DropZone };
