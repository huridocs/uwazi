import React, { PropsWithChildren } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface TableBodyProps extends PropsWithChildren {
  draggableRows: boolean;
}
const TableBody = ({ draggableRows, children }: TableBodyProps) => (
  <tbody>
    {(draggableRows === true && <DndProvider backend={HTML5Backend}>{children}</DndProvider>) ||
      (draggableRows === false && <>{children}</>)}
  </tbody>
);

export { TableBody };
