/** @jest-environment jsdom */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MetadataCard } from '../MetadataCard';
import { MetadataItemsTable } from '../MetadataItemsTable';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MetadataItemsTable', () => {
  it('renders label|value rows with baseline table structure', () => {
    render(
      <MetadataCard title="Details">
        <MetadataItemsTable
          items={[
            {
              id: 'creation',
              label: 'Creation Date',
              translationContext: 'System',
              content: <span>Jan 1, 2024</span>,
            },
            {
              id: 'text',
              label: 'A basic simple text',
              translationContext: 'template1',
              content: <span className="font-medium leading-snug">Hello</span>,
            },
          ]}
        />
      </MetadataCard>
    );

    expect(screen.getByRole('heading', { level: 4, name: 'Details' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByRole('rowheader', { name: 'Creation Date' })).toBeInTheDocument();
    expect(
      within(table).getByRole('rowheader', { name: 'A basic simple text' })
    ).toBeInTheDocument();
    expect(within(table).getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(within(table).getByText('Hello')).toBeInTheDocument();
  });

  it('returns null when there are no items', () => {
    const { container } = render(<MetadataItemsTable items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
