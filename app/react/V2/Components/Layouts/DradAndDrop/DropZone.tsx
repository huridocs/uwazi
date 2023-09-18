/* eslint-disable import/exports-last */
import React from 'react';
import type { FC } from 'react';
import type { DropTargetMonitor } from 'react-dnd';
import { Translate } from 'app/I18N';
import { withDnD } from 'app/componentWrappers';
import { ItemTypes } from 'app/V2/shared/types';

interface DroppableProps {
  name: string;
  type: ItemTypes;
  useDrop?: Function;
  onDrop?: Function;
}

const DropZoneComponent: FC<DroppableProps> = ({ name, useDrop = () => {}, type, onDrop }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: () => ({ name, onDrop }),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;
  return (
    <div
      className={`flex flex-col items-center justify-center  text-gray-400 uppercase p-15 h-14 text-base m-5 ${
        isActive
          ? ' bg-bray-800 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'
          : 'empty'
      } border border-gray-300 border-dashed rounded-sm cursor-pointer bg-gray-50 `}
      ref={drop}
      data-testid={name}
    >
      <Translate>Drag items here</Translate>
    </div>
  );
};

const DropZone = withDnD(DropZoneComponent);
export { DropZone };
