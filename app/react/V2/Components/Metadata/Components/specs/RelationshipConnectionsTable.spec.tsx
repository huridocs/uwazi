/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { RelationshipConnectionsTable } from '../RelationshipConnectionsTable.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const renderTable = (
  columns: {
    label: string;
    inheritedType?: string;
    cellsByEntityId?: Record<string, React.ReactNode>;
  }[] = [{ label: 'Inherited', cellsByEntityId: { e1: 'Value' } }]
) =>
  render(
    <RelationshipConnectionsTable
      rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
      columns={columns}
    />
  );

describe('RelationshipConnectionsTable layout', () => {
  it('uses horizontal scroll only', () => {
    const { container } = renderTable();
    const scrollWrap = container.querySelector('.overflow-x-auto');
    expect(scrollWrap).toBeTruthy();
    expect(scrollWrap?.className).not.toContain('max-h-60');
    expect(scrollWrap?.className).not.toMatch(/\boverflow-auto\b/);
    expect(scrollWrap?.querySelector('table')?.className).toMatch(/\bw-max\b/);
    expect(scrollWrap?.querySelector('table')?.className).toMatch(/\bmin-w-full\b/);
  });

  it('sizes entity and scalar inherited cells', () => {
    renderTable();
    const cells = within(screen.getByText('Alpha').closest('tr') as HTMLElement).getAllByRole(
      'cell'
    );
    expect(cells[0].className).toContain('max-w-40');
    expect(cells[0].className).not.toContain('min-w-0');
    expect(cells[1].className).toContain('min-w-0');
  });

  it('applies type min-widths for geo media and image columns', () => {
    renderTable([
      { label: 'Loc', inheritedType: 'geolocation', cellsByEntityId: { e1: 'g' } },
      { label: 'Clip', inheritedType: 'media', cellsByEntityId: { e1: 'm' } },
      { label: 'Photo', inheritedType: 'image', cellsByEntityId: { e1: 'i' } },
    ]);
    const row = screen.getByText('Alpha').closest('tr') as HTMLElement;
    const cells = within(row).getAllByRole('cell');
    expect(cells[1].className).toContain('min-w-72');
    expect(cells[2].className).toContain('min-w-64');
    expect(cells[3].className).toContain('min-w-48');
    const headers = within(row.closest('table') as HTMLElement).getAllByRole('columnheader');
    expect(headers[1].className).toContain('min-w-72');
    expect(headers[2].className).toContain('min-w-64');
    expect(headers[3].className).toContain('min-w-48');
  });
});
