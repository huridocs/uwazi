/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from '@testing-library/react';
import {
  clearSelection,
  clickCard,
  expectActionsMenu,
  expectCloseClearsCards,
  expectCloseClearsMap,
  expectCloseClearsTable,
  expectCtrlPair,
  expectFooterChrome,
  expectFooterLabels,
  expectPanelRows,
  expectSingleEntity,
} from './libraryMultiSelectAssertions.js';
import {
  ready,
  renderLibrary,
  resetEntityMocks,
  restoreMediaMock,
} from './libraryMultiSelectHarness.js';

describe('library multi-select', () => {
  beforeEach(() => {
    resetEntityMocks();
  });

  afterEach(() => {
    restoreMediaMock();
  });

  it('shows one entity on a plain click and the multi-select chrome only for a range', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    clickCard('Gelman', { shiftKey: true });
    expectPanelRows();
    expectFooterLabels();
    expectFooterChrome();
    expectActionsMenu();
    clearSelection();
  });

  it('toggles entities with ctrl or cmd', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    await expectSingleEntity('Mexico');
    clickCard('Gelman', { ctrlKey: true });
    expectCtrlPair();
    clickCard('Mexico', { metaKey: true });
    await expectSingleEntity('Case 11.481 (Gelman)');
  });

  it('selects a table range with shift', async () => {
    renderLibrary('table');
    fireEvent.click(await ready('Mexico'));
    fireEvent.click(screen.getByText('Case 11.481 (Gelman)'), { shiftKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent(
      'Case 10.488 (Ellacuría)'
    );
  });

  it('clears cards, table rows, and the map selection when the panel closes', async () => {
    await expectCloseClearsCards(renderLibrary);
    await expectCloseClearsTable(renderLibrary);
    await expectCloseClearsMap(renderLibrary);
  });

  it('selects every entity in a map cluster and toggles markers with ctrl', async () => {
    renderLibrary('map');
    fireEvent.click(await screen.findByRole('button', { name: 'cluster' }));
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent('Mexico');
    expect(screen.getByTestId('library-selection-panel')).toHaveTextContent('Case 11.481 (Gelman)');
    fireEvent.click(screen.getByRole('button', { name: 'Close selection list' }));
    fireEvent.click(screen.getByRole('button', { name: 'marker-mexico' }));
    fireEvent.click(screen.getByRole('button', { name: 'marker-ellacuria' }), { ctrlKey: true });
    expect(screen.getByTestId('library-selection-count')).toHaveTextContent('2 entities');
    expect(screen.getByTestId('library-selection-panel')).not.toHaveTextContent('Gelman');
  });
});
