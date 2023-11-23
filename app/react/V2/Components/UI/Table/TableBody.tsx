import React, { PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';
import { get } from 'lodash';
import { ItemTypes } from 'app/V2/shared/types';
import { TableRow } from './TableRow';
import { withDnD, withDnDBackend } from '../../componentWrappers';
import { useDnDContext } from '../../Layouts/DragAndDrop';

interface TableBodyProps extends PropsWithChildren {
  draggableRows: boolean;
  DndProvider?: React.FC<any>;
  HTML5Backend?: any;
  items: any;
  table: any;
  onChange?: any;
  subRowsKey?: string;
}

type TypeWithId<T> = T & {
  id: string;
};

// eslint-disable-next-line comma-spacing
const setItemId = <T,>(item: T, parent: TypeWithId<T> | undefined, index: number) => ({
  ...item,
  id: parent ? `${parent.id}.${index}` : index.toString(),
});

const setRowId: <T>(subRowsKey: string, records: T[], parent?: TypeWithId<T>) => TypeWithId<T>[] = (
  subRowsKey,
  records,
  parent
) =>
  (records || [])
    .filter(f => f)
    .map((item, index) => {
      const itemWithId = setItemId(item, parent, index);
      return {
        ...itemWithId,
        ...(subRowsKey
          ? {
              [subRowsKey]: setRowId(subRowsKey, get(item, subRowsKey), itemWithId),
            }
          : {}),
      };
    });

// eslint-disable-next-line comma-spacing
const TableBodyComponent = <T,>({
  draggableRows,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  DndProvider,
  HTML5Backend,
  items,
  table,
  subRowsKey,
  onChange,
}: TableBodyProps) => {
  const dndContext = useDnDContext<T>(
    ItemTypes.ROW,
    {
      getDisplayName: item => item.id!,
      itemsProperty: subRowsKey,
      onChange,
    },
    setRowId(subRowsKey || 'items', items),
    []
  );
  return draggableRows && DndProvider && HTML5Backend ? (
    <tbody>
      <DndProvider backend={HTML5Backend}>
        {dndContext.activeItems
          .map(item => {
            const itemValue = item.value as TypeWithId<T>;
            const row = table.getRowModel().rowsById[itemValue.id];
            const children =
              row && row.getIsExpanded()
                ? (item.value.items || []).map(subItem => {
                    const subItemValue = subItem.value as TypeWithId<T>;
                    const childRow = table.getRowModel().rowsById[subItemValue.id];
                    return (
                      <TableRow
                        key={subItem.id}
                        draggableRow
                        row={childRow}
                        dndContext={dndContext}
                        enableSelection={false}
                        item={subItem}
                      />
                    );
                  })
                : [];
            return (
              <>
                <TableRow
                  key={item.id}
                  draggableRow
                  row={row}
                  dndContext={dndContext}
                  enableSelection={false}
                  item={item}
                />
                {children}
              </>
            );
          })
          .filter(row => row !== undefined)}
      </DndProvider>
    </tbody>
  ) : (
    <tbody>
      {table.getRowModel().rows.map((row: Row<T>) => (
        <TableRow<T> key={row.id} row={row} enableSelection={false} />
      ))}
    </tbody>
  );
};

const TableBody = (props: TableBodyProps) => withDnD(withDnDBackend(TableBodyComponent))(props);

export { TableBody };
