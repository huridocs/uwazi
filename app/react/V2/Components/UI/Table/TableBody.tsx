import React, { PropsWithChildren } from 'react';
import { withDnD, withDnDBackend } from '../../componentWrappers';
import { IDnDContext } from '../../Layouts/DragAndDrop';

interface TableBodyProps<T> extends PropsWithChildren {
  draggableRows: boolean;
  DndProvider?: React.FC<any>;
  HTML5Backend?: any;
  dndContext?: IDnDContext<T>;
}
// eslint-disable-next-line comma-spacing
const TableBodyComponent = <T,>({
  draggableRows,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  DndProvider = () => <></>,
  children,
  HTML5Backend = {},
  dndContext,
}: TableBodyProps<T>) =>
  draggableRows && dndContext ? (
    <DndProvider backend={HTML5Backend}>{children}</DndProvider>
  ) : (
    <tbody>{children}</tbody>
  );

const TableBody = (props: TableBodyProps<any>) =>
  withDnD(withDnDBackend(TableBodyComponent))(props);

export { TableBody };
