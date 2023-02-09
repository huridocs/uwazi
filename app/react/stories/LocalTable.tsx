import React from 'react';
import './button.css';

import { Table } from 'flowbite-react';

interface LocalTableProps {
  /**
   * Labels for the header
   */
  header: string[];
  /**
   * What background color to use
   */
  backgroundColor?: string;
}

/**
 * Primary UI component for user interaction
 */
export const LocalTable = ({ header, backgroundColor, ...props }: LocalTableProps) => (
  <Table>
    <Table.Head>
      <Table.HeadCell>Product name</Table.HeadCell>
      <Table.HeadCell>Color</Table.HeadCell>
      <Table.HeadCell>Category</Table.HeadCell>
      <Table.HeadCell>Price</Table.HeadCell>
      <Table.HeadCell>
        <span className="sr-only">Edit</span>
      </Table.HeadCell>
    </Table.Head>
    <Table.Body className="divide-y">
      <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
          Apple MacBook Pro 17"
        </Table.Cell>
        <Table.Cell>Sliver</Table.Cell>
        <Table.Cell>Laptop</Table.Cell>
        <Table.Cell>$2999</Table.Cell>
        <Table.Cell>
          <a
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            href="/tables"
          >
            Edit
          </a>
        </Table.Cell>
      </Table.Row>
      <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
          Microsoft Surface Pro
        </Table.Cell>
        <Table.Cell>White</Table.Cell>
        <Table.Cell>Laptop PC</Table.Cell>
        <Table.Cell>$1999</Table.Cell>
        <Table.Cell>
          <a
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            href="/tables"
          >
            Edit
          </a>
        </Table.Cell>
      </Table.Row>
      <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
          Magic Mouse 2
        </Table.Cell>
        <Table.Cell>Black</Table.Cell>
        <Table.Cell>Accessories</Table.Cell>
        <Table.Cell>$99</Table.Cell>
        <Table.Cell>
          <a
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            href="/tables"
          >
            Edit
          </a>
        </Table.Cell>
      </Table.Row>
      <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
          Google Pixel Phone
        </Table.Cell>
        <Table.Cell>Gray</Table.Cell>
        <Table.Cell>Phone</Table.Cell>
        <Table.Cell>$799</Table.Cell>
        <Table.Cell>
          <a
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            href="/tables"
          >
            Edit
          </a>
        </Table.Cell>
      </Table.Row>
      <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
          Apple Watch 5
        </Table.Cell>
        <Table.Cell>Red</Table.Cell>
        <Table.Cell>Wearables</Table.Cell>
        <Table.Cell>$999</Table.Cell>
        <Table.Cell>
          <a
            className="font-medium text-blue-600 hover:underline dark:text-blue-500"
            href="/tables"
          >
            Edit
          </a>
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  </Table>
);
