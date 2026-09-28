/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { card, clickCard, expectSingleEntity } from './libraryMultiSelectAssertions.js';
import {
  deleteEntities,
  getPermissions,
  longPress,
  ready,
  renderLibrary,
  resetEntityMocks,
  restoreMediaMock,
} from './libraryMultiSelectHarness.js';
import {
  cancelPanelDelete,
  confirmPanelDelete,
  expectPermissionsLoaded,
  longPressEachView,
  openPermissions,
} from './librarySelectionCommandAssertions.js';

const oneEntityActions = () => screen.getByTestId('library-single-select-actions');

const selectMexico = async () => {
  renderLibrary('cards');
  await ready('Mexico');
  clickCard('Mexico');
  await expectSingleEntity('Mexico');
};

const expectTextOnlyEdit = (footer: HTMLElement) => {
  const edit = within(footer).getByRole('button', { name: 'Edit' });
  expect(within(footer).getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  expect(edit.querySelector('svg')).toBeNull();
};

const openTab = (name: string | RegExp) => {
  fireEvent.click(screen.getByRole('tab', { name }));
  expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
};

const expectMetadataEditing = async () => {
  expect(await screen.findByRole('tab', { name: 'Metadata' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
};

describe('library selection commands', () => {
  beforeEach(() => {
    resetEntityMocks();
  });

  afterEach(() => {
    restoreMediaMock();
  });

  it('edits metadata from the one-entity panel bar', async () => {
    await selectMexico();
    fireEvent.click(within(oneEntityActions()).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy from/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('keeps one text-only Edit on Files and Relationships, and edits from those tabs', async () => {
    await selectMexico();
    const footer = screen.getByTestId('library-entity-preview-footer');
    openTab(/Files/);
    expectTextOnlyEdit(footer);
    openTab(/^Relationships/);
    expectTextOnlyEdit(footer);
    fireEvent.click(within(oneEntityActions()).getByRole('button', { name: 'Edit' }));
    await expectMetadataEditing();
  });

  it('opens permissions from the lock on the one-entity panel bar', async () => {
    await selectMexico();
    fireEvent.click(within(oneEntityActions()).getByRole('button', { name: 'Permissions' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Share' })).toBeInTheDocument();
    await waitFor(() => {
      expect(getPermissions).toHaveBeenCalledWith(['mexico']);
    });
  });

  it('deletes the selected entity from the trash on the one-entity panel bar', async () => {
    await selectMexico();
    fireEvent.click(within(oneEntityActions()).getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Delete 1 entity?' })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(deleteEntities).toHaveBeenCalledWith(['mexico']);
    });
  });

  it('confirms delete and removes the selected entities', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    clickCard('Gelman', { shiftKey: true });
    await cancelPanelDelete();
    await confirmPanelDelete();
  });

  it('reuses the entity share dialog for permissions on the selection', async () => {
    const dialog = await openPermissions();
    await expectPermissionsLoaded(dialog);
  });

  it('adds a card, a table row, and a map marker on a touch long press', async () => {
    await longPressEachView();
  });

  it('keeps shift selection and ignores a mouse long press', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    longPress(card('Gelman'), 'mouse');
    await expectSingleEntity('Mexico');
    clickCard('Gelman', { shiftKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
    expect(screen.getByTestId('library-selection-panel')).toBeInTheDocument();
  });
});
