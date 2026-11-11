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

const expectNarrowIcon = (button: HTMLElement) => {
  expect(button.querySelector('svg')).toHaveClass('@min-[672px]:hidden');
  expect(button.querySelector('span')).toHaveClass('@max-[671px]:hidden');
};

const expectCollapsePairTogether = () => {
  const collapse = screen.getByRole('button', { name: 'Collapse all' });
  const expand = screen.getByRole('button', { name: 'Expand all' });
  expect(collapse.parentElement).toBe(expand.parentElement);
  expect(collapse.parentElement?.contains(screen.getByRole('button', { name: 'Cancel' }))).toBe(
    false
  );
  expectNarrowIcon(collapse);
  expectNarrowIcon(expand);
};

const expectIconButton = (name: string) => {
  const button = screen.getByRole('button', { name });
  expect(button.querySelector('svg')).not.toBeNull();
  expect(button).not.toHaveTextContent(new RegExp(name, 'i'));
};

const selectFirstRelationship = async (user: UserEvent) => {
  await expandAll(user);
  await user.click(screen.getAllByRole('checkbox')[0]);
};

const expectIdleEdit = () => {
  expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
};

const expectCompactIcons = () => {
  expectCollapsePairTogether();
  expectIconButton('Create relationship');
  expectIconButton('Manage types');
  expectIconButton('Select all');
  expectIconButton('Deselect all');
  expect(screen.getByRole('button', { name: 'Deselect all' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveTextContent('Cancel');
};

const expectGroupOpen = (open: boolean) => {
  const icon = screen.getByRole('button', { name: 'Related 2' }).querySelector('svg');
  if (open) expect(icon).not.toHaveClass('-rotate-90');
  else expect(icon).toHaveClass('-rotate-90');
};

const expectSelectionExpanded = (checked: boolean) => {
  expectGroupOpen(true);
  screen.getAllByRole('checkbox').forEach(box => {
    if (checked) expect(box).toBeChecked();
    else expect(box).not.toBeChecked();
  });
};

const expectEditingRelationships = () => {
  expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
};

const editWithSelection = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: /edit/i }));
  await selectFirstRelationship(user);
};

const toggleRelationshipsPanel = async (user: UserEvent, name: string) => {
  await user.click(screen.getByRole('button', { name }));
};

const cancelEditFromBar = async (user: UserEvent) => {
  const dialog = screen.getByRole('dialog');
  const barCancel = screen
    .getAllByRole('button', { name: 'Cancel' })
    .find(button => !dialog.contains(button));
  if (!barCancel) throw new Error('Cancel on the edit bar was not found');
  await user.click(barCancel);
};

const buttonLabel = (button: HTMLElement) =>
  button.getAttribute('aria-label') ?? button.textContent?.trim();

const expectActionOrder = async (user: UserEvent) => {
  const create = screen.getByRole('button', { name: 'Create relationship' });
  const cluster = create.parentElement?.parentElement;
  const names = [...(cluster?.querySelectorAll('button') ?? [])].map(buttonLabel);
  expect(names).toEqual([
    'Create relationship',
    'Manage types',
    'Select all',
    'Deselect all',
    'Delete',
    'Cancel',
  ]);
  await user.hover(create);
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Create relationship');
};

describe('Relationships action bar', () => {
  it('lets the user select relationships for bulk actions and cancel editing', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();
    expectIdleEdit();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await expandAll(user);
    expectEditingRelationships();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expectIdleEdit();
  });

  it('expands the list when selecting or clearing every relationship', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expectGroupOpen(false);

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expectSelectionExpanded(true);
    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expectGroupOpen(false);
    await user.click(screen.getByRole('button', { name: 'Deselect all' }));
    expectSelectionExpanded(false);
  });

  it('offers to create a relationship while editing', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument();
  });

  it('shows a compact edit bar with icon actions', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar({ compact: true });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expectCompactIcons();

    await selectFirstRelationship(user);
    await expectActionOrder(user);
  });

  it('keeps the selection when the relationships panel unmounts', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();
    await editWithSelection(user);
    expect(screen.getByText(/Selected/)).toBeInTheDocument();

    await toggleRelationshipsPanel(user, 'Hide relationships panel');
    expect(screen.getByText(/Selected/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await toggleRelationshipsPanel(user, 'Show relationships panel');
    await expandAll(user);
    expect(screen.getByRole('checkbox', { checked: true })).toBeInTheDocument();
  });

  it('closes the delete confirmation when editing is canceled', async () => {
    const user = userEvent.setup();
    renderRelationshipsActionBar();
    await editWithSelection(user);
    await user.click(screen.getByRole('button', { name: /^Delete$/ }));
    expect(await screen.findByText('Delete relationship')).toBeInTheDocument();

    await cancelEditFromBar(user);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
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
