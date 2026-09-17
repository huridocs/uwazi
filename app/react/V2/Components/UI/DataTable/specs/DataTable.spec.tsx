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
