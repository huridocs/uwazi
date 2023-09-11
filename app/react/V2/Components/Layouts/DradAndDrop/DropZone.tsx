/* eslint-disable import/exports-last */
import React from 'react';
import type { FC } from 'react';
import type { DropTargetMonitor } from 'react-dnd';
import { Translate } from 'app/I18N';
import { withDnD } from 'app/componentWrappers';
import { ItemTypes } from 'app/V2/shared/types';

interface DroppableProps {
  type: ItemTypes;
  useDrop?: Function;
  addCard?: Function;
}

const DropZoneComponent: FC<DroppableProps> = ({ useDrop = () => {}, type, addCard }) => {
  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: () => ({ name: 'Dustbin', addCard }),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const isActive = canDrop && isOver;
  return (
    <div
      className={`flex flex-col items-center justify-center w-full h-64 ${
        isActive
          ? ' bg-bray-800 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'
          : 'empty'
      } border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 `}
      ref={drop}
      // data-testid="dustbin"
    >
      <div className="no-properties">
        <div className="no-properties-wrap">
          <Translate>Drag items here</Translate>
        </div>
      </div>
    </div>
  );
};

const DropZone = withDnD(DropZoneComponent);
export { DropZone };
