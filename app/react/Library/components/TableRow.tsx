import React from 'react';
import { PropertySchema } from 'shared/types/commonTypes';

interface TableRowProps {
  columns: PropertySchema[];
  document: any;
}

function displayCell(document: any, column: any, index: number) {
  const cellValue = document.metadata[column.name]
    ? document.metadata[column.name].value
    : document[column.name];
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index && <input type="checkbox" />}
      {cellValue instanceof Object ? JSON.stringify(cellValue) : cellValue}
    </td>
  );
}

export class TableRow extends React.Component<TableRowProps> {
  render() {
    return (
      <tr>
        {this.props.columns.map((column: any, index: number) =>
          displayCell(this.props.document, column, index)
        )}
      </tr>
    );
  }
}
