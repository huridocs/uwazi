import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { card, clickCard } from './libraryMultiSelectAssertions.js';
import {
  deleteEntities,
  getPermissions,
  longPress,
  ready,
  renderLibrary,
} from './libraryMultiSelectHarness.js';

const selectMexicoThroughGelman = async () => {
  renderLibrary('cards');
  await ready('Mexico');
  clickCard('Mexico');
  clickCard('Gelman', { shiftKey: true });
};

const panelFooter = () =>
  within(screen.getByTestId('library-selection-panel')).getByTestId('library-selection-footer');

const expectDeleteCopy = (dialog: HTMLElement) => {
  expect(within(dialog).getByRole('heading', { name: 'Delete 3 entities?' })).toBeInTheDocument();
  expect(
    within(dialog).getByText('Undo restores them until your next delete or bulk change.')
  ).toBeInTheDocument();
  expect(dialog.querySelector('.text-seal')).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Delete' })).toHaveClass('bg-button-danger');
};

const cancelPanelDelete = async () => {
  fireEvent.click(within(panelFooter()).getByRole('button', { name: 'Delete' }));
  const dialog = await screen.findByRole('dialog');
  expectDeleteCopy(dialog);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(deleteEntities).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
};

const confirmPanelDelete = async () => {
  fireEvent.click(within(panelFooter()).getByRole('button', { name: 'Delete' }));
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' })
  );
  await waitFor(() => {
    expect(deleteEntities).toHaveBeenCalledWith(['mexico', 'ellacuria', 'gelman']);
  });
  await waitFor(() => {
    expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  });
};

const expectShareDialog = (dialog: HTMLElement) => {
  expect(within(dialog).getByRole('heading', { name: 'Share' })).toBeInTheDocument();
  expect(within(dialog).getByText('General access')).toBeInTheDocument();
  expect(
    within(dialog).getByText('Administrators and Editors always have edit access')
  ).toBeInTheDocument();
  expect(within(dialog).getByPlaceholderText('Username, email or group')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  expect(within(dialog).queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
};

const openPermissions = async () => {
  await selectMexicoThroughGelman();
  fireEvent.click(within(panelFooter()).getByRole('button', { name: 'Permissions' }));
  return screen.findByRole('dialog');
};

const expectPermissionsLoaded = async (dialog: HTMLElement) => {
  expectShareDialog(dialog);
  await waitFor(() => {
    expect(getPermissions).toHaveBeenCalledWith(['mexico', 'ellacuria', 'gelman']);
  });
};

const expectTwoSelected = (second: string) => {
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('2 entities');
  expect(screen.getByTestId('library-selection-panel')).toHaveTextContent('Mexico');
  expect(screen.getByTestId('library-selection-panel')).toHaveTextContent(second);
};

const longPressCard = async () => {
  const cards = renderLibrary('cards');
  await ready('Mexico');
  clickCard('Mexico');
  await screen.findByTestId('library-entity-preview');
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  longPress(card('Gelman'));
  expectTwoSelected('Gelman');
  cards.unmount();
};

const longPressTable = async () => {
  const table = renderLibrary('table');
  fireEvent.click(await screen.findByText('Mexico'));
  longPress(screen.getByText('Case 11.481 (Gelman)'));
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('2 entities');
  table.unmount();
};

const longPressMap = async () => {
  renderLibrary('map');
  fireEvent.click(await screen.findByRole('button', { name: 'marker-mexico' }));
  longPress(screen.getByRole('button', { name: 'marker-ellacuria' }));
  expectTwoSelected('Ellacuría');
};

const longPressEachView = async () => {
  await longPressCard();
  await longPressTable();
  await longPressMap();
};

export {
  cancelPanelDelete,
  confirmPanelDelete,
  expectPermissionsLoaded,
  longPressEachView,
  openPermissions,
  selectMexicoThroughGelman,
};
