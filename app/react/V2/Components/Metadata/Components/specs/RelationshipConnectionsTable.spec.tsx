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

const renderTable = () =>
  render(
    <RelationshipConnectionsTable
      rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
      columns={[{ label: 'Inherited', cellsByEntityId: { e1: 'Value' } }]}
    />
  );

describe('RelationshipConnectionsTable layout', () => {
  it('uses horizontal scroll only', () => {
    const { container } = renderTable();
    const scrollWrap = container.querySelector('.overflow-x-auto');
    expect(scrollWrap).toBeTruthy();
    expect(scrollWrap?.className).not.toContain('max-h-60');
    expect(scrollWrap?.className).not.toMatch(/\boverflow-auto\b/);
  });

  it('sizes entity and inherited cells', () => {
    renderTable();
    const cells = within(screen.getByText('Alpha').closest('tr') as HTMLElement).getAllByRole(
      'cell'
    );
    expect(cells[0].className).toContain('max-w-40');
    expect(cells[0].className).not.toContain('min-w-0');
    expect(cells[1].className).toContain('min-w-0');
  });
});
