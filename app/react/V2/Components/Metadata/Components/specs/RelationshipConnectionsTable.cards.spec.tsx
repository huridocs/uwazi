/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return this.hasAttribute('data-connections-probe') ? 600 : 0;
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
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
  });

  it('places distinct rollups on the card set, not each card', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e1', label: 'Alpha', templateId: 't1' },
          { id: 'e2', label: 'Beta', templateId: 't1' },
        ]}
        columns={[
          { label: 'Country', cellsByEntityId: { e1: 'Kenya', e2: 'Kenya' } },
          { label: 'Role', cellsByEntityId: { e1: 'Judge', e2: 'Clerk' } },
        ]}
      />
    );
    const stack = cardStack();
    expect(within(stack).getAllByText('1 distinct')).toHaveLength(1);
    expect(within(stack).getAllByText('Kenya')).toHaveLength(2);
  });

  it('repeats inherit labels and values on each card', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e1', label: 'Alpha', templateId: 't1' },
          { id: 'e2', label: 'Beta', templateId: 't1' },
        ]}
        columns={[
          { label: 'Country', cellsByEntityId: { e1: 'Kenya', e2: 'Kenya' } },
          { label: 'Role', cellsByEntityId: { e1: 'Judge', e2: 'Clerk' } },
        ]}
      />
    );
    const stack = cardStack();
    const grid = stack.firstElementChild;
    expect(grid?.className).toContain('grid-cols-[fit-content(40%)_minmax(0,1fr)]');
    expect(stack.querySelector('.grid-cols-subgrid')).toBeTruthy();
    expect(within(stack).getAllByText('Kenya')[0].className).not.toContain('whitespace-nowrap');
    expect(within(stack).getAllByText('Country')).toHaveLength(3);
    expect(within(stack).getByText('Judge')).toBeInTheDocument();
    expect(within(stack).getByText('Clerk')).toBeInTheDocument();
  });

  it('keeps edit actions on each card', () => {
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
