/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRelationshipsActionBar } from './helpers/renderRelationshipsActionBar.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('RelationshipsActionBar', () => {
  it('enters edit mode with row checkboxes and exits on cancel', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('shows delete controls when a relationship is selected in edit mode', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getAllByRole('checkbox')[0]);

    expect(screen.getByText(/selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
