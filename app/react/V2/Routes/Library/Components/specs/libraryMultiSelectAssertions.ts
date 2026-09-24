import { fireEvent, screen, waitFor, within } from '@testing-library/react';

const results = () => screen.getByRole('region', { name: 'Library results' });

const card = (title: string) => within(results()).getByRole('button', { name: new RegExp(title) });

const clickCard = (
  title: string,
  modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
) => fireEvent.click(card(title), modifiers);

const selectionActionLabels = ['Edit', 'Change template', 'Export CSV', 'Permissions', 'Delete'];

const expectSelectionActions = (footer: HTMLElement) => {
  const buttons = within(footer).getAllByRole('button');
  expect(
    buttons.slice(0, selectionActionLabels.length).map(button => button.getAttribute('aria-label'))
  ).toEqual(selectionActionLabels);
  selectionActionLabels.forEach(label => {
    expect(within(footer).getByRole('button', { name: label })).not.toHaveClass('hidden');
  });
  expect(within(footer).queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
};

const expectSingleEntity = async (title: string) => {
  await waitFor(() => {
    expect(
      within(screen.getByTestId('library-entity-preview')).getByText(title)
    ).toBeInTheDocument();
  });
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  const footer = screen.getByTestId('library-multi-select-footer');
  expectSelectionActions(footer);
  expect(within(footer).getByTestId('library-selected-count')).toHaveTextContent('1 selected');
  expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
};

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

const expectDesktopLabelClasses = (footer: HTMLElement) => {
  expect(footer).toHaveClass('@container', 'w-full');
  expect(footer).not.toHaveClass('flex');
  const bar = footer.firstElementChild;
  expect(bar).toHaveClass('flex');
  expect(bar).not.toHaveClass('@container');
  selectionActionLabels.forEach(label => {
    const text = within(within(footer).getByRole('button', { name: label })).getByText(label);
    expect(text.parentElement).toHaveClass('hidden', '@min-[56rem]:inline');
  });
};

const expectFooterLabels = () => {
  const footer = selectionFooter();
  expectSelectionActions(footer);
  expectDesktopLabelClasses(footer);
  expect(within(footer).getByRole('button', { name: 'Edit' }).querySelector('svg')).toHaveAttribute(
    'width',
    '13'
  );
  expect(within(footer).getByRole('button', { name: 'Edit' }).innerHTML).toContain('M13 21h8');
  expect(
    within(footer).getByRole('checkbox', { name: 'Deselect the loaded entities' })
  ).toBeInTheDocument();
};

const expectPanelChrome = () => {
  const panel = screen.getByTestId('library-selection-panel');
  expect(panel).toHaveTextContent('Selection');
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
  expect(within(panel).getByRole('button', { name: 'Close selection list' })).toBeInTheDocument();
  const panelFooter = within(panel).getByTestId('library-selection-footer');
  expect(panelFooter).toHaveClass('h-12');
  expect(within(panelFooter).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  expect(within(panelFooter).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  expect(within(panelFooter).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
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

const expectActionsMenu = () => {
  const panel = screen.getByTestId('library-selection-panel');
  fireEvent.click(within(panel).getByRole('button', { name: 'Actions' }));
  const menu = screen.getByRole('menu', { name: 'Selection actions' });
  ['Change template', 'Export CSV', 'Permissions'].forEach(label => {
    expect(within(menu).getByRole('menuitem', { name: label })).toBeInTheDocument();
  });
  expect(within(menu).queryByRole('menuitem', { name: 'Share' })).not.toBeInTheDocument();
  expect(within(menu).getByRole('separator')).toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  expect(within(menu).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
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
  expect(screen.getByTestId('library-selected-count')).toHaveTextContent('1 selected');
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
