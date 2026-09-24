import { fireEvent, screen, within } from '@testing-library/react';
import {
  expectActionsMenu,
  expectFooterLabels,
  expectPanelBar,
  expectSingleEntity,
} from './libraryDesktopFooterAssertions.js';

const results = () => screen.getByRole('region', { name: 'Library results' });

const card = (title: string) => within(results()).getByRole('button', { name: new RegExp(title) });

const clickCard = (
  title: string,
  modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
) => fireEvent.click(card(title), modifiers);

const expectPanelRows = () => {
  const panel = screen.getByTestId('library-selection-panel');
  ['Mexico', 'Case 10.488 (Ellacuría)', 'Case', 'Case 11.481 (Gelman)'].forEach(text => {
    expect(panel).toHaveTextContent(text);
  });
  expect(panel).toHaveTextContent(/Country\s*·\s*Americas · North America\s*·\s*1981/);
  const viewLinks = within(panel).getAllByRole('link', { name: 'View' });
  expect(viewLinks).toHaveLength(3);
  expect(viewLinks[0]).toHaveAttribute('href', '/en/entityv2/mexico');
  expect(within(panel).getAllByTestId('entity-quiet-mark')[0]).toHaveClass('w-7', 'h-7');
  expect(
    within(panel).getByRole('button', { name: 'Remove Mexico from selection' })
  ).toBeInTheDocument();
};

const selectionFooter = () => screen.getByTestId('library-multi-select-footer');

const expectPanelChrome = () => {
  const panel = screen.getByTestId('library-selection-panel');
  expect(panel).toHaveTextContent('Selection');
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
  expect(within(panel).getByRole('button', { name: 'Close selection list' })).toBeInTheDocument();
  const panelFooter = within(panel).getByTestId('library-selection-footer');
  expect(panelFooter).toHaveClass('h-12');
  expect(within(panelFooter).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  expect(within(panelFooter).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  expectPanelBar();
};

const expectPageSelectionFooter = () => {
  expect(screen.getByTestId('library-selected-count')).toHaveTextContent('3 selected');
  expect(
    within(selectionFooter()).getAllByRole('button', { name: 'Clear' }).length
  ).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-entity-preview')).not.toBeInTheDocument();
};

const expectFooterChrome = () => {
  expectPanelChrome();
  expectPageSelectionFooter();
};

const expectCreateFooter = () => {
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
};

const closeSelectionPanel = () => {
  fireEvent.click(
    within(screen.getByTestId('library-selection-panel')).getByRole('button', { name: 'Close' })
  );
};

const expectCardsDeselected = () => {
  ['Mexico', 'Ellacuría', 'Gelman'].forEach(title => {
    expect(card(title)).toHaveAttribute('aria-pressed', 'false');
  });
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
};

const tableRow = (title: string) =>
  within(screen.getByTestId('library-table')).getByText(title).closest('[class*="bg-parchment"]');

const expectTableRowsDeselected = () => {
  ['Mexico', 'Case 11.481 (Gelman)', 'Case 10.488 (Ellacuría)'].forEach(title => {
    expect(tableRow(title)).toBeNull();
  });
};

type RenderLibrary = (view: 'cards' | 'table' | 'map') => { unmount: () => void };

const expectCloseClearsCards = async (renderLibrary: RenderLibrary) => {
  const view = renderLibrary('cards');
  await screen.findByText('Mexico');
  clickCard('Mexico');
  clickCard('Gelman', { shiftKey: true });
  expect(card('Mexico')).toHaveAttribute('aria-pressed', 'true');
  expect(card('Gelman')).toHaveAttribute('aria-pressed', 'true');
  closeSelectionPanel();
  expectCardsDeselected();
  view.unmount();
};

const expectCloseClearsTable = async (renderLibrary: RenderLibrary) => {
  const view = renderLibrary('table');
  fireEvent.click(await screen.findByText('Mexico'));
  fireEvent.click(screen.getByText('Case 11.481 (Gelman)'), { shiftKey: true });
  expect(tableRow('Mexico')).not.toBeNull();
  expect(tableRow('Case 11.481 (Gelman)')).not.toBeNull();
  closeSelectionPanel();
  expectTableRowsDeselected();
  view.unmount();
};

const expectCloseClearsMap = async (renderLibrary: RenderLibrary) => {
  renderLibrary('map');
  fireEvent.click(await screen.findByRole('button', { name: 'cluster' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close selection list' }));
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'marker-mexico' }));
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  expect(screen.getByTestId('library-single-select-actions')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
};

const clearSelection = () => {
  const [clear] = within(selectionFooter()).getAllByRole('button', { name: 'Clear' });
  fireEvent.click(clear);
  expectCreateFooter();
};

const expectCtrlPair = () => {
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('2 entities');
  const panel = screen.getByTestId('library-selection-panel');
  expect(panel).toHaveTextContent('Mexico');
  expect(panel).toHaveTextContent('Case 11.481 (Gelman)');
  expect(panel).not.toHaveTextContent('Ellacuría');
};

export {
  card,
  clearSelection,
  clickCard,
  expectCloseClearsCards,
  expectCloseClearsMap,
  expectCloseClearsTable,
  expectActionsMenu,
  expectCtrlPair,
  expectFooterChrome,
  expectFooterLabels,
  expectPanelRows,
  expectSingleEntity,
};
