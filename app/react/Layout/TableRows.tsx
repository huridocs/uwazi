import React, { useState } from 'react';

import { connect, ConnectedProps } from 'react-redux';

import { TableRow } from 'app/Library/components/TableRow';
import { IStore, TableViewColumn } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';

interface TableRowsProps {
  columns: TableViewColumn[];
  storeKey: 'library' | 'uploads';
  clickOnDocument: (e: React.SyntheticEvent, doc: EntitySchema, active: boolean) => any;
  documents: IImmutable<{ rows: EntitySchema[] }>;
}
const mapStateToProps = (state: IStore, props: TableRowsProps) => ({
  documents: state[props.storeKey].documents,
});

const connector = connect(mapStateToProps);
type mappedProps = ConnectedProps<typeof connector> & TableRowsProps;

const TableRowsComponent = ({ documents, columns, clickOnDocument, storeKey }: mappedProps) => {
  const [multipleSelection, setMultipleSelection] = useState(false);
  return (
    <>
      {documents.get('rows').map((entity: any) => (
        <TableRow
          {...{
            entity,
            columns,
            clickOnDocument,
            storeKey,
            key: entity.get('_id'),
            setMultipleSelection,
            multipleSelection,
          }}
        />
      ))}
    </>
  );
};

export const TableRows = connect(mapStateToProps)(TableRowsComponent);
