/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { card, clickCard } from './libraryMultiSelectAssertions.js';
import {
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

describe('library selection commands', () => {
  beforeEach(() => {
    resetEntityMocks();
  });

  afterEach(() => {
    restoreMediaMock();
  });

  it('opens the entity preview when Edit is used on one selected entity', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    const panel = await screen.findByTestId('library-selection-panel');
    fireEvent.click(within(panel).getByRole('button', { name: 'Edit' }));
    await waitFor(() => {
      expect(screen.getByTestId('library-entity-preview')).toHaveTextContent('Mexico');
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
    await screen.findByTestId('library-selection-panel');
    longPress(card('Gelman'), 'mouse');
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('1 entity');
    clickCard('Gelman', { shiftKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
  });
});
