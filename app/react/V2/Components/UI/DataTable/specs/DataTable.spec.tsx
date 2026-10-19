/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable.js';

describe('DataTable density', () => {
  const columns = [
    {
      id: 'name',
      header: 'Name',
      cell: (row: { rowId: string; name: string }) => row.name,
    },
  ];
  const data = [{ rowId: '1', name: 'Row' }];

  it('uses comfortable padding by default', () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(container.querySelector('.min-h-11')).toBeTruthy();
  });

  it('tightens vertical padding in compact density without changing type size', () => {
    const { container } = render(<DataTable columns={columns} data={data} density="compact" />);
    const row = container.querySelector('.min-h-8');
    expect(row).toBeTruthy();
    expect(row?.className).toContain('text-sm');
    expect(container.querySelector('.min-h-11')).toBeFalsy();
  });
});

const manyRows = Array.from({ length: 41 }, (_, index) => ({
  rowId: String(index),
  name: `Row ${index}`,
}));

const nameColumn = [
  {
    id: 'name',
    header: 'Name',
    cell: (row: { rowId: string; name: string }) => row.name,
  },
];

const installIdleObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: () => undefined,
    unobserve: () => undefined,
    disconnect: () => undefined,
    takeRecords: () => [],
    root: null,
    rootMargin: '',
    thresholds: [],
  }));
};

describe('DataTable virtualize', () => {
  const originalObserver = global.IntersectionObserver;

  afterEach(() => {
    global.IntersectionObserver = originalObserver;
  });

  it('renders every row when virtualize is off', () => {
    installIdleObserver();
    render(<DataTable columns={nameColumn} data={manyRows} />);
    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.getByText('Row 40')).toBeInTheDocument();
  });

  it('renders the first screen and leaves the rest as placeholders', () => {
    installIdleObserver();
    render(<DataTable columns={nameColumn} data={manyRows} virtualize />);
    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.queryByText('Row 40')).not.toBeInTheDocument();
  });

  it('keeps every row mounted when reordering is enabled', () => {
    installIdleObserver();
    render(
      <DataTable
        columns={nameColumn}
        data={manyRows}
        virtualize
        reorder={{ onReorder: () => undefined }}
      />
    );
    expect(screen.getByText('Row 0')).toBeInTheDocument();
    expect(screen.getByText('Row 40')).toBeInTheDocument();
  });
});
