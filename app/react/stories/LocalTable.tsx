import React from 'react';
import './button.css';

import { Table } from 'flowbite-react';

interface LocalTableProps {
  /**
   * Labels for the header
   */
  header: string[];
  /**
   * Data content
   */
  rows: (string | number)[][];
}

/**
 * Primary UI component for user interaction
 */
export const LocalTable = ({ header, rows }: LocalTableProps) => (
  <div className="tw-content">
    <Table>
      <Table.Head>
        {header.map(columnName => (
          <Table.HeadCell>{columnName}</Table.HeadCell>
        ))}
      </Table.Head>
      <Table.Body className="divide-y">
        {rows.map(row => (
          <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
            {row.map(cell => (
              <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
                {cell}
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
);
