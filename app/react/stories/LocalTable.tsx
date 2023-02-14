import React from 'react';
import './button.css';

import { Table } from 'flowbite-react';

interface Column {
  accesor?: string;
  header: React.ReactElement | string;
  className?: string;
  cell?: (item?: { [key: string]: any }) => React.ReactElement;
}

interface LocalTableProps {
  /**
   * Column definition
   */
  columns: Column[];
  /**
   * Data content
   */
  data: { [key: string]: any }[];
}

export const LocalTable = ({ columns, data }: LocalTableProps) => (
  <div className="tw-content">
    <Table>
      <Table.Head>
        {columns.map(column => (
          <Table.HeadCell>{column.header}</Table.HeadCell>
        ))}
      </Table.Head>
      <Table.Body className="divide-y">
        {data.map(item => (
          <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            {columns.map(column => (
              <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
                {column.cell && column.cell(item)}
                {column.accesor && item[column.accesor]}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
);
