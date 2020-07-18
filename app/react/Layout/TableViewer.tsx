import React from "react";
import { useTable } from 'react-table'

export interface DocumentViewerProps {
  rowListZoomLevel: number,
  documents: any,
  storeKey: 'library' | 'uploads',
  clickOnDocument: (...args: any[]) => any,
  onSnippetClick: (...args: any[]) => any,
  deleteConnection: (...args: any[]) => any,
  search: any,
}

export function TableViewer(props: DocumentViewerProps) {
  const columns = [
    { 
      Header: 'Titulo',
      accessor: 'title',
    }
  ];
  const data = props.documents.get('rows').map((doc: any) => ({ title: doc.get('title') }));

  const table = useTable({columns, data});

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = table;
  
  return (
    // apply the table props
    <table {...getTableProps()}>
      <thead>
        {// Loop over the header rows
        headerGroups.map((headerGroup: any) => (
          // Apply the header row props
          <tr {...headerGroup.getHeaderGroupProps()}>
            {// Loop over the headers in each row
            headerGroup.headers.map((column: any) => (
              // Apply the header cell props
              <th {...column.getHeaderProps()}>
                {// Render the header
                column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* Apply the table body props */}
      <tbody {...getTableBodyProps()}>
        {// Loop over the table rows
        rows.map((row: any) => {
          // Prepare the row for display
          prepareRow(row)
          return (
            // Apply the row props
            <tr {...row.getRowProps()}>
              {// Loop over the rows cells
              row.cells.map((cell: any) => {
                // Apply the cell props
                return (
                  <td {...cell.getCellProps()}>
                    {// Render the cell contents
                    cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
