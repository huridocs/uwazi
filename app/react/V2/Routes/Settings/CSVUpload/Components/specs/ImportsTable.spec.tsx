/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { templatesAtom, localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { TestRouterContext } from '#V2/testing/TestRouterContext.js';
import { ImportsTable } from '../ImportsTable.js';
import { csvImportsList, templates, translations } from './fixtures.js';

describe('CSV imports list table', () => {
  let locale: 'en' | 'ar' = 'en';

  const renderComponent = async () => {
    await act(() => {
      render(
        <TestRouterContext loaderData={{ list: csvImportsList }}>
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, templates],
              [localeAtom, locale],
              [translationsAtom, translations],
            ]}
          >
            <ImportsTable />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );
    });
  };

  it('should display the general statistics', async () => {
    await renderComponent();

    const expectStatistic = (label: string, value: string) => {
      const labelNode = within(screen.getByTestId('table-header')).getByText(label);
      const statContainer = labelNode.parentElement;

      expect(statContainer).not.toBeNull();
      expect(statContainer).toHaveTextContent(value);
      expect(statContainer).toHaveTextContent(label);
    };

    expectStatistic('Total imports', '4');
    expectStatistic('Processing', '1');
    expectStatistic('Completed', '1');
    expectStatistic('Failed jobs', '1');
  });

  it('should render the data in the tables', async () => {
    await renderComponent();

    const expectedRows = [
      ['Queued', 'people.csv', 'People', '0⁄0', '', '', 'Apr 7, 2024'],
      ['Processing', 'cases.zip', 'Cases', '120⁄48', '44', '1', 'Apr 8, 2024'],
      ['Completed', 'events.csv', 'Events', '86⁄86', '84', '0', 'Apr 9, 2024'],
      ['Failed', 'documents.csv', 'Documents', '60⁄17', '15', '2', 'Apr 10, 2024'],
    ];

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(expectedRows.length);

    expectedRows.forEach((expectedCells, index) => {
      const cells = within(rows[index]).getAllByRole('cell');
      expectedCells.forEach((value, cellIndex) => {
        expect(cells[cellIndex]).toHaveTextContent(value);
      });
    });
  });

  it('should print date based on locale', async () => {
    locale = 'ar';
    await renderComponent();
    expect(screen.getByText('7 أبريل 2024')).toBeInTheDocument();
  });

  it('should translate template names', async () => {
    await renderComponent();
    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(screen.getByText('الناس')).toBeInTheDocument();
  });
});
