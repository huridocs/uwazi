/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelationshipConnectionsTable } from '../RelationshipConnectionsTable.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const cardStack = () => screen.getByTestId('connection-card-stack');

describe('RelationshipConnectionsTable cards', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.hasAttribute('data-connections-root') ? 400 : 0;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
  });

  it('shows one card per entity with each property label and value', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e1', label: 'Alpha', templateId: 't1' },
          { id: 'e2', label: 'Beta', templateId: 't1' },
        ]}
        columns={[
          { label: 'Country', cellsByEntityId: { e1: 'Kenya', e2: 'Kenya' } },
          { label: 'Role', cellsByEntityId: { e1: 'Judge', e2: '' } },
        ]}
      />
    );
    const stack = cardStack();
    expect(stack.querySelectorAll('.rounded-md.border')).toHaveLength(2);
    expect(within(stack).getAllByText('Country')).toHaveLength(2);
    expect(within(stack).getAllByText('Kenya')).toHaveLength(2);
    expect(within(stack).getAllByText('—')).toHaveLength(1);
    expect(within(stack).getByText('Judge')).toBeInTheDocument();
    expect(within(stack).queryByText('Clerk')).not.toBeInTheDocument();
    expect(within(stack).getAllByText('Kenya')[0]).toHaveClass('wrap-break-word');
  });

  it('folds a long inherited value on the card', async () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    const user = userEvent.setup();
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Second', templateId: 't1' }]}
        columns={[
          {
            label: 'Markdown',
            inheritedType: 'markdown',
            cellsByEntityId: { e1: 't is a long established fact' },
          },
        ]}
      />
    );

    expect(within(cardStack()).getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(within(cardStack()).getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('orders cards the same way as the table', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e2', label: 'Ben', templateId: 't1' },
          { id: 'e1', label: 'Ana', templateId: 't1' },
        ]}
        columns={[{ label: 'Country', cellsByEntityId: { e2: 'Zambia', e1: 'Kenya' } }]}
      />
    );
    const text = cardStack().textContent ?? '';
    expect(text.indexOf('Ana')).toBeLessThan(text.indexOf('Ben'));
  });

  it('shows the row action on the card', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
        renderActions={row => <button type="button">Remove {row.label}</button>}
      />
    );
    expect(within(cardStack()).getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
  });
});
