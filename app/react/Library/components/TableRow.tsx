import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IStore, TableViewColumn } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';
import { FormattedMetadataValue, TableCell } from 'app/Library/components/TableCell';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';

interface TableRowProps {
  columns: TableViewColumn[];
  entity: IImmutable<EntitySchema>;
  storeKey?: 'library' | 'uploads';
  selected?: boolean;
  clickOnDocument: (...args: any[]) => void;
  multipleSelection: boolean;
  setMultipleSelection: React.Dispatch<React.SetStateAction<boolean>>;
}

const getColumnValue = (
  formattedEntity: { [k: string]: string },
  columnValues: Map<string, FormattedMetadataValue>,
  column: TableViewColumn
) => {
  let columnValue: FormattedMetadataValue;
  const columnName = column.name!;
  if (!column.isCommonProperty || columnName === 'creationDate' || columnName === 'editDate') {
    columnValue = columnValues.get(columnName) as FormattedMetadataValue;
  } else {
    const commonPropValue =
      columnName === 'templateName' ? formattedEntity.documentType : formattedEntity[columnName];
    columnValue = column as FormattedMetadataValue;
    columnValue.value = commonPropValue;
  }
  return columnValue;
};

const mapStateToProps = (state: IStore, { entity, storeKey = 'library' }: TableRowProps) => {
  const selected: boolean =
    state[storeKey].ui
      .get('selectedDocuments')
      .find(
        (doc: IImmutable<EntitySchema> | undefined) => doc?.get('_id') === entity.get('_id')
      ) !== undefined;
  return {
    selected,
    templates: state.templates,
    thesauris: state.thesauris,
    zoomLevel: state[storeKey].ui.get('zoomLevel'),
  };
};

const connector = connect(mapStateToProps);
type mappedProps = ConnectedProps<typeof connector> & TableRowProps;

const TableRowComponent = ({
  clickOnDocument,
  entity,
  templates,
  thesauris,
  columns,
  selected,
  multipleSelection,
  setMultipleSelection,
  zoomLevel = 2,
}: mappedProps) => {
  const checkEntity = (e: React.MouseEvent) => {
    const { metaKey, ctrlKey, shiftKey } = e;
    clickOnDocument({ metaKey, ctrlKey, shiftKey }, entity, selected, multipleSelection);
    setMultipleSelection(true);
    e.stopPropagation();
  };

  const selectRow = (e: React.MouseEvent) => {
    const sel = window.getSelection();
    if (sel?.type !== 'Range') {
      const { metaKey, ctrlKey, shiftKey } = e;
      const specialkeyPressed = metaKey || ctrlKey || shiftKey;
      setMultipleSelection(specialkeyPressed);
      clickOnDocument({ metaKey, ctrlKey, shiftKey }, entity, selected, specialkeyPressed);
    }
  };

  const renderCell = (index: number, columnValue: FormattedMetadataValue) =>
    index > 0 ? (
      <TableCell content={columnValue} zoomLevel={zoomLevel} />
    ) : (
      <div>
        <div className="checkbox-cell" onClick={checkEntity}>
          <input
            type="checkbox"
            onChange={() => {}}
            checked={multipleSelection && selected}
            onClick={checkEntity}
          />
        </div>
        <TableCell content={columnValue} zoomLevel={zoomLevel} />
      </div>
    );

  const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauris, null, {
    sortedProperties: ['editDate', 'creationDate'],
  });
  const columnValues = new Map();
  formattedEntity.metadata.forEach((prop: FormattedMetadataValue) => {
    columnValues.set(prop.name, prop);
  });

  return (
    <tr
      className={`template-${formattedEntity.template} ${selected ? 'selected' : ''}`}
      onClick={selectRow}
    >
      {columns.map((column: TableViewColumn, index: number) => {
        const columnValue = getColumnValue(formattedEntity, columnValues, column);
        const columnKey = formattedEntity._id + column.name;
        return (
          <td className={!index ? 'sticky-col' : ''} key={`column_${columnKey}`}>
            {renderCell(index, columnValue)}
          </td>
        );
      })}
    </tr>
  );
};

export const TableRow = connect(mapStateToProps)(TableRowComponent);
