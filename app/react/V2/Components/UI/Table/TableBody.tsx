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

type TypeWithDnDId<T> = T & {
  dndId: string;
};

// eslint-disable-next-line comma-spacing
const setItemId = <T,>(item: T, parent: TypeWithDnDId<T> | undefined, index: number) => ({
  ...item,
  dndId: parent ? `${parent.dndId}.${index}` : index.toString(),
});

const setRowId: <T>(
  subRowsKey: string,
  records: T[],
  parent?: TypeWithDnDId<T>
) => TypeWithDnDId<T>[] = (subRowsKey, records, parent) =>
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
      getDisplayName: item => item.dndId!,
      itemsProperty: subRowsKey,
      onChange,
    },
    items,
    []
  );

  return draggableRows && DndProvider && HTML5Backend ? (
    <tbody data-testid="dnd_table_body">
      <DndProvider backend={HTML5Backend}>
        {dndContext.activeItems
          .map(item => {
            const itemValue = item.value as TypeWithDnDId<T>;
            const row = table.getRowModel().rowsById[itemValue.dndId];
            const children =
              row && row.getIsExpanded()
                ? (item.value.items || []).map(subItem => {
                    const subItemValue = subItem.value as TypeWithDnDId<T>;
                    const childRow = table.getRowModel().rowsById[subItemValue.dndId];
                    return (
                      <TableRow
                        key={subItem.dndId}
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
              <React.Fragment key={item.dndId}>
                <TableRow
                  draggableRow
                  row={row}
                  dndContext={dndContext}
                  enableSelection={false}
                  item={item}
                />
                {children}
              </React.Fragment>
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

const typedMemo: <T>(c: T) => T = React.memo;

const TableBody = (props: TableBodyProps) => {
  const tableBodyProps = { ...props, items: setRowId(props.subRowsKey || 'items', props.items) };
  return withDnD(typedMemo(withDnDBackend(TableBodyComponent)))(tableBodyProps);
};

export { TableBody };
