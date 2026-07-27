/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderRelationshipsActionBar } from './helpers/renderRelationshipsActionBar.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const expandAll = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Expand all' }));
};

describe('Relationships action bar', () => {
  it('lets the user select relationships for bulk actions and cancel editing', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await expandAll(user);

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('offers to create a relationship while editing', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument();
  });

  it('offers to delete selected relationships while editing', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await expandAll(user);
    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(screen.getByText(/selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
