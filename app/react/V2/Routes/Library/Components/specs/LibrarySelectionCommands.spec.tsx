/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, within } from '@testing-library/react';
import { card, clickCard, expectSingleEntity } from './libraryMultiSelectAssertions.js';
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

  it('keeps the entity preview when Edit is used on one selected entity', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    fireEvent.click(
      within(screen.getByTestId('library-multi-select-footer')).getByRole('button', {
        name: 'Edit',
      })
    );
    await expectSingleEntity('Mexico');
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
