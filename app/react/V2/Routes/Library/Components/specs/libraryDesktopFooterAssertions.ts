import { fireEvent, screen, waitFor, within } from '@testing-library/react';

const multiSelectLabels = ['Edit', 'Export CSV', 'Permissions', 'Delete'];

const persistentLabels = ['Create entity', 'Upload PDF', 'Import CSV', 'Export CSV'] as const;

const expectNoShareOrTemplate = () => {
  expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Change template' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Share' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: 'Change template' })).not.toBeInTheDocument();
};

const expectShownLabel = (control: HTMLElement, label: string) => {
  expect(control.querySelector('svg')).toBeTruthy();
  expect(control).toHaveTextContent(label);
  const text = within(control).getByText(label);
  const parentClass = text.parentElement?.className ?? '';
  expect(parentClass.split(/\s+/)).not.toContain('hidden');
  expect(parentClass).not.toContain('@min-');
  expect(parentClass).not.toContain('@[');
  expect(control.className.split(/\s+/)).not.toContain('hidden');
};

const childSequence = (root: HTMLElement) =>
  [...root.children].map(child => {
    if (child.getAttribute('data-testid') === 'library-footer-divider') {
      return 'divider';
    }
    return child.getAttribute('aria-label') || child.textContent?.replace(/\s+/g, ' ').trim() || '';
  });

const selectionPanelFooter = () =>
  within(screen.getByTestId('library-selection-panel')).getByTestId('library-selection-footer');

const panelBarSequence = (footer: HTMLElement) =>
  [...footer.children].flatMap(child => {
    const text = child.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text ? [text] : [];
  });

const expectPanelBar = () => {
  const footer = selectionPanelFooter();
  ['Share', 'Change template', 'Permissions', 'Delete'].forEach(name => {
    expect(within(footer).queryByRole('button', { name })).not.toBeInTheDocument();
  });
  expect(within(footer).queryByRole('link', { name: 'View entity' })).not.toBeInTheDocument();
  expect(panelBarSequence(footer)).toEqual(['Close', 'Edit', 'Actions']);
  expect(within(footer).getByRole('button', { name: 'Edit' }).querySelector('svg')).toBeTruthy();
  expect(within(footer).getByRole('button', { name: 'Close' }).querySelector('svg')).toBeNull();
};

const expectPersistentActions = (footer: HTMLElement) => {
  const left = within(footer).getByTestId('library-results-actions');
  const labels = [...left.querySelectorAll('button, a')].map(control =>
    control.textContent?.replace(/\s+/g, ' ').trim()
  );
  expect(labels).toEqual([...persistentLabels]);
  persistentLabels.forEach(label => {
    const control =
      label === 'Import CSV'
        ? within(left).getByRole('link', { name: label })
        : within(left).getByRole('button', { name: label });
    expectShownLabel(control, label);
  });
};

const expectIconOnly = (root: HTMLElement, label: string) => {
  const button = within(root).getByRole('button', { name: label });
  expect(button.querySelector('svg')).toBeTruthy();
  expect(button).not.toHaveTextContent(label);
};

const expectSingleSelectBar = (footer: HTMLElement, preview: HTMLElement) => {
  const actions = within(footer).getByTestId('library-single-select-actions');
  expect(childSequence(actions)).toEqual([
    'Edit',
    'divider',
    'Permissions',
    'divider',
    'Delete',
    'divider',
    'Close',
    'View entity',
  ]);
  expectShownLabel(within(actions).getByRole('button', { name: 'Edit' }), 'Edit');
  ['Permissions', 'Delete'].forEach(label => expectIconOnly(actions, label));
  expect(within(actions).getByRole('button', { name: 'Close' }).querySelector('svg')).toBeNull();
  const viewEntity = within(actions).getByRole('link', { name: 'View entity' });
  expect(viewEntity).toHaveClass('bg-ink');
  expect(viewEntity).toHaveAttribute(
    'href',
    within(preview)
      .getByRole('link', { name: /View entity/ })
      .getAttribute('href')
  );
};

const expectSingleEntity = async (title: string) => {
  const preview = await waitFor(() => {
    const panel = screen.getByTestId('library-entity-preview');
    expect(within(panel).getByText(title)).toBeInTheDocument();
    return panel;
  });
  expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-multi-select-footer')).not.toBeInTheDocument();
  const footer = screen.getByTestId('library-results-footer');
  expectPersistentActions(footer);
  expectSingleSelectBar(footer, preview);
  expect(within(footer).queryByRole('checkbox')).not.toBeInTheDocument();
  expectNoShareOrTemplate();
};

const selectionFooter = () => screen.getByTestId('library-multi-select-footer');

const expectDesktopLabelClasses = (footer: HTMLElement) => {
  expect(footer).toHaveClass('w-full');
  expect(footer).not.toHaveClass('@container');
  multiSelectLabels.forEach(label => {
    const button = within(footer).getByRole('button', { name: label });
    expectShownLabel(button, label);
    const text = within(button).getByText(label);
    expect(text.parentElement?.className.split(/\s+/) ?? []).toContain('sm:inline');
  });
};

const expectMultiSelectActions = (footer: HTMLElement) => {
  const actions = within(footer).getByTestId('library-multi-select-actions');
  expect(childSequence(actions)).toEqual([
    'Edit',
    'Export CSV',
    'Permissions',
    'divider',
    'Delete',
  ]);
  expectDesktopLabelClasses(footer);
  const edit = within(footer).getByRole('button', { name: 'Edit' });
  expect(edit.querySelector('svg')).toHaveAttribute('width', '13');
  expect(edit.innerHTML).toContain('M13 21h8');
  expect(within(footer).getByRole('button', { name: 'Delete' })).toHaveClass('text-seal-label');
};

const expectMultiSelectSummary = (footer: HTMLElement) => {
  expect(
    within(footer).getByRole('checkbox', { name: 'Deselect the loaded entities' })
  ).toBeInTheDocument();
  expect(within(footer).getByTestId('library-selected-count')).toHaveTextContent(/\d+ selected/);
  expect(within(footer).getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  ['Actions', 'Create entity', 'Upload PDF'].forEach(name => {
    expect(within(footer).queryByRole('button', { name })).not.toBeInTheDocument();
  });
  expect(within(footer).queryByRole('link', { name: 'Import CSV' })).not.toBeInTheDocument();
};

const expectFooterLabels = () => {
  const footer = selectionFooter();
  expectMultiSelectActions(footer);
  expectMultiSelectSummary(footer);
  expectNoShareOrTemplate();
};

const menuSequence = (menu: HTMLElement) =>
  [...menu.children].flatMap(child => {
    if (child.tagName === 'HR') {
      return ['divider'];
    }
    const text = child.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    return text ? [text] : [];
  });

const expectMenuItems = (menu: HTMLElement) => {
  expect(menuSequence(menu)).toEqual(['Export CSV', 'Permissions', 'divider', 'Delete']);
  expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveClass('text-seal-label');
  ['Edit', 'Share', 'Change template'].forEach(name => {
    expect(within(menu).queryByRole('menuitem', { name })).not.toBeInTheDocument();
  });
};

const expectActionsMenu = () => {
  expectPanelBar();
  fireEvent.click(within(selectionPanelFooter()).getByRole('button', { name: 'Actions' }));
  expectMenuItems(screen.getByRole('menu', { name: 'Selection actions' }));
  expectNoShareOrTemplate();
};

export { expectActionsMenu, expectFooterLabels, expectPanelBar, expectSingleEntity };
