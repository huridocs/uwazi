import { fireEvent, screen, waitFor, within } from '@testing-library/react';

const card = (title: string) => screen.getByRole('button', { name: new RegExp(title) });

const clickCard = (
  title: string,
  modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }
) => fireEvent.click(card(title), modifiers);

const expectSingleEntity = async (title: string) => {
  await waitFor(() => {
    expect(
      within(screen.getByTestId('library-entity-preview')).getByText(title)
    ).toBeInTheDocument();
  });
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
};

const expectPanelRows = () => {
  const panel = screen.getByTestId('library-selection-panel');
  expect(panel).toHaveTextContent('Selection');
  expect(screen.getByTestId('library-selection-count')).toHaveTextContent('3 entities');
  ['Mexico', 'Country', 'Case 10.488 (Ellacuría)', 'Case', 'Case 11.481 (Gelman)'].forEach(text => {
    expect(panel).toHaveTextContent(text);
  });
  const viewLinks = within(panel).getAllByRole('link', { name: 'View' });
  expect(viewLinks).toHaveLength(3);
  expect(viewLinks[0]).toHaveAttribute('href', '/en/entityv2/mexico');
};

const expectFooterLabels = () => {
  const footer = screen.getByTestId('library-multi-select-footer');
  ['Edit', 'Change template', 'Export CSV', 'Share', 'Permissions', 'Delete'].forEach(label => {
    expect(footer).toHaveTextContent(label);
  });
};

const expectFooterChrome = () => {
  expect(screen.getByTestId('library-selected-count')).toHaveTextContent('3 selected');
  expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-entity-preview')).not.toBeInTheDocument();
};

const expectActionsMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
  expect(screen.getByRole('menuitem', { name: 'Change template' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
};

const expectCreateFooter = () => {
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
};

const clearSelection = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  expectCreateFooter();
};

const expectCtrlPair = () => {
  expect(screen.getByTestId('library-selected-count')).toHaveTextContent('2 selected');
  const panel = screen.getByTestId('library-selection-panel');
  expect(panel).toHaveTextContent('Mexico');
  expect(panel).toHaveTextContent('Case 11.481 (Gelman)');
  expect(panel).not.toHaveTextContent('Ellacuría');
};

export {
  clearSelection,
  clickCard,
  expectActionsMenu,
  expectCtrlPair,
  expectFooterChrome,
  expectFooterLabels,
  expectPanelRows,
  expectSingleEntity,
};
