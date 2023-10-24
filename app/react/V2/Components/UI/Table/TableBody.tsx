import React, { PropsWithChildren } from 'react';
import { withDnD, withDnDBackend } from '../../componentWrappers';

interface TableBodyProps extends PropsWithChildren {
  draggableRows: boolean;
  DndProvider?: React.FC<any>;
  HTML5Backend?: any;
}
const TableBodyComponent = ({
  draggableRows,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  DndProvider = () => <></>,
  children,
  HTML5Backend = {},
}: TableBodyProps) => (
  <tbody>
    {(draggableRows === true && <DndProvider backend={HTML5Backend}>{children}</DndProvider>) ||
      (draggableRows === false && <>{children}</>)}
  </tbody>
);

const TableBody = (props: TableBodyProps) => withDnD(withDnDBackend(TableBodyComponent))(props);
export { TableBody };
