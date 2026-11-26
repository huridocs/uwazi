/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import * as notifyBridge from '#V2/utils/notifyBridge.js';
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

  describe('active tab edit', () => {
    it('does not offer Edit on Files', async () => {
      await selectMexico();
      openTab(/Files/);
      const footer = screen.getByTestId('library-entity-preview-footer');
      expect(within(footer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Files/ })).toHaveAttribute('aria-selected', 'true');
    });

    it('edits relationships in place', async () => {
      await selectMexico();
      openTab(/^Relationships/);
      expectTextOnlyEdit(screen.getByTestId('library-entity-preview-footer'));
      fireEvent.click(within(oneEntityActions()).getByRole('button', { name: 'Edit' }));
      expect(screen.getByRole('tab', { name: /^Relationships/ })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        await screen.findByRole('button', { name: 'Create relationship' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(within(oneEntityActions()).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });
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

describe('library csv export', () => {
  const fetchMock = jest.fn();
  let downloaded: string | undefined;

  const csvResponse = () => ({
    ok: true,
    status: 200,
    text: async () => 'title\nMexico',
    headers: { get: () => 'attachment; filename="uwazi.csv"' },
  });

  const exportedIds = () => {
    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('export'));
    if (!call) {
      throw new Error(
        `no export request in ${fetchMock.mock.calls.map(([url]) => url).join(', ')}`
      );
    }
    return JSON.parse(call[1].body).ids;
  };

  beforeEach(() => {
    resetEntityMocks();
    downloaded = undefined;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(csvResponse());
    global.fetch = fetchMock;
    Object.assign(URL, { createObjectURL: () => 'blob:csv', revokeObjectURL: jest.fn() });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement
    ) {
      downloaded = this.download;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    restoreMediaMock();
  });

  it('exports every loaded entity when nothing is selected', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => {
      expect(exportedIds()).toEqual(['mexico', 'ellacuria', 'gelman']);
    });
    expect(downloaded).toBe('uwazi.csv');
  });

  it('exports the one selected entity', async () => {
    await selectMexico();
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => {
      expect(exportedIds()).toEqual(['mexico']);
    });
  });

  it('reports a failed export', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
      headers: { get: () => null },
    });
    const notify = jest.spyOn(notifyBridge, 'notify').mockImplementation(() => undefined);
    renderLibrary('cards');
    await ready('Mexico');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('An error has occurred during data export', 'error');
    });
  });

  it('exports the multi-selection from the selection bar', async () => {
    renderLibrary('cards');
    await ready('Mexico');
    clickCard('Mexico');
    clickCard('Gelman', { ctrlKey: true });
    fireEvent.click(
      within(screen.getByTestId('library-multi-select-footer')).getByRole('button', {
        name: 'Export CSV',
      })
    );
    await waitFor(() => {
      expect(exportedIds()).toEqual(['mexico', 'gelman']);
    });
  });
});
