/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import {
  isMobileOverrideAtom,
  localeAtom,
  settingsAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

type FooterProps = {
  onCreateEntity?: () => void;
  onUploadPdf?: (files: File[]) => void;
  onExportCsv?: () => void;
  onOpenFilters?: () => void;
  onShowResults?: () => void;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPagination?: boolean;
};

const renderFooter = (
  props: FooterProps = {},
  options: {
    user?: typeof adminUser | Record<string, never>;
    featureFlagLibraryV2?: boolean;
    mobile?: boolean;
  } = {}
) => {
  const { user = adminUser, featureFlagLibraryV2 = false, mobile = false } = options;
  return render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, user],
          [settingsAtom, { features: { featureFlagLibraryV2 } }],
          ...(mobile ? [[isMobileOverrideAtom, true] as const] : []),
        ]}
      >
        <LibraryResultsFooter
          onCreateEntity={props.onCreateEntity}
          onUploadPdf={props.onUploadPdf}
          onExportCsv={props.onExportCsv}
          onOpenFilters={props.onOpenFilters}
          onShowResults={props.onShowResults}
          page={props.page}
          limit={props.limit}
          total={props.total}
          onPageChange={props.onPageChange}
          onLimitChange={props.onLimitChange}
          showPagination={props.showPagination}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );
};

const pdfFileInput = () => {
  const input = document.querySelector('input[type="file"]');
  expect(input).toBeInstanceOf(HTMLInputElement);
  return input as HTMLInputElement;
};

const expectChosenPdf = (input: HTMLInputElement, onUploadPdf: jest.Mock) => {
  const pdf = new File(['%PDF'], 'judgment.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [pdf] } });
  expect(onUploadPdf).toHaveBeenCalledWith([pdf]);
};

const expectNativePdfPicker = (onUploadPdf: jest.Mock) => {
  const input = pdfFileInput();
  expect(input).toHaveAttribute('accept', 'application/pdf,.pdf');
  expect(input).toHaveAttribute('multiple');
  const openPicker = jest.spyOn(input, 'click');
  fireEvent.click(screen.getByRole('button', { name: 'Upload PDF' }));
  expect(openPicker).toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(onUploadPdf).not.toHaveBeenCalled();
  expectChosenPdf(input, onUploadPdf);
};

const openActionsMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
  return screen.getByRole('menu', { name: 'Actions' });
};

const openPaneMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Library panes' }));
  return screen.getByRole('menu', { name: 'Library panes' });
};

const expectDesktopActionBar = () => {
  expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Upload PDF' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Import CSV' })).toHaveAttribute(
    'href',
    '/en/settings/csv'
  );
  expect(screen.getByRole('button', { name: 'Export CSV' }).querySelector('svg')).toBeTruthy();
};

const expectNoMobileChrome = () => {
  expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Library panes' })).not.toBeInTheDocument();
  expect(screen.queryByTestId('library-single-select-actions')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Change template' })).not.toBeInTheDocument();
};

const expectNoEditorActions = () => {
  expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Upload PDF' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Import CSV' })).not.toBeInTheDocument();
};

const expectMobileActionsCollapsed = () => {
  expect(screen.queryByRole('button', { name: 'Create entity' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Upload PDF' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Import CSV' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument();
};

const expectActionsMenuContents = (menu: HTMLElement) => {
  expect(within(menu).getByRole('menuitem', { name: 'Create entity' })).toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Upload PDF' })).toBeInTheDocument();
  expect(within(menu).getByRole('menuitem', { name: 'Import CSV' })).toHaveAttribute(
    'href',
    '/en/settings/csv'
  );
  expect(within(menu).getByRole('menuitem', { name: 'Export CSV' })).toBeInTheDocument();
};

const expectMenuTrigger = (name: string) => {
  const trigger = screen.getByRole('button', { name });
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  return trigger;
};

const expectPaneMenuOpensFilters = (onOpenFilters: jest.Mock) => {
  const paneTrigger = expectMenuTrigger('Library panes');
  const menu = openPaneMenu();
  expect(paneTrigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Filters' }));
  expect(onOpenFilters).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu', { name: 'Library panes' })).not.toBeInTheDocument();
};

const expectPaneMenuOpensResults = (onShowResults: jest.Mock) => {
  openPaneMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Results' }));
  expect(onShowResults).toHaveBeenCalledTimes(1);
};

describe('LibraryResultsFooter', () => {
  it('renders the library action bar when featureFlagLibraryV2 is off', () => {
    renderFooter({}, { featureFlagLibraryV2: false });
    expectDesktopActionBar();
    expectNoMobileChrome();
  });

  it('hides editor actions for anonymous users even when the V2 flag is on', () => {
    renderFooter({}, { user: {}, featureFlagLibraryV2: true });
    expect(screen.getByTestId('library-results-footer')).toBeInTheDocument();
    expectNoEditorActions();
  });

  it('opens create and the native PDF file picker', () => {
    const onCreateEntity = jest.fn();
    const onUploadPdf = jest.fn();
    renderFooter({ onCreateEntity, onUploadPdf }, { featureFlagLibraryV2: false });
    fireEvent.click(screen.getByRole('button', { name: 'Create entity' }));
    expect(onCreateEntity).toHaveBeenCalledTimes(1);
    expectNativePdfPicker(onUploadPdf);
  });

  it('groups create actions under Actions on mobile', () => {
    const onCreateEntity = jest.fn();
    renderFooter({ onCreateEntity }, { featureFlagLibraryV2: true, mobile: true });
    expectMobileActionsCollapsed();
    const actionsTrigger = expectMenuTrigger('Actions');
    const menu = openActionsMenu();
    expect(actionsTrigger).toHaveAttribute('aria-expanded', 'true');
    expectActionsMenuContents(menu);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Create entity' }));
    expect(onCreateEntity).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('opens the native PDF picker from the mobile Actions menu', () => {
    const onUploadPdf = jest.fn();
    renderFooter({ onUploadPdf }, { mobile: true });
    openActionsMenu();
    const input = pdfFileInput();
    const openPicker = jest.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Upload PDF' }));
    expect(openPicker).toHaveBeenCalled();
    expect(screen.queryByRole('menu', { name: 'Actions' })).not.toBeInTheDocument();
    expectChosenPdf(input, onUploadPdf);
  });

  it('hides editor items in the mobile Actions menu for anonymous users', () => {
    renderFooter({}, { user: {}, mobile: true });
    const menu = openActionsMenu();
    expect(within(menu).queryByRole('menuitem', { name: 'Create entity' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Upload PDF' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Import CSV' })).not.toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Export CSV' })).toBeInTheDocument();
  });

  it('opens Filters and Results from the mobile pane menu', () => {
    const onOpenFilters = jest.fn();
    const onShowResults = jest.fn();
    renderFooter({ onOpenFilters, onShowResults }, { mobile: true });
    expectPaneMenuOpensFilters(onOpenFilters);
    expectPaneMenuOpensResults(onShowResults);
  });

  describe('pagination', () => {
    it('pages from the desktop footer', () => {
      const onPageChange = jest.fn();
      renderFooter(
        { page: 1, limit: 30, total: 4398, onPageChange },
        { featureFlagLibraryV2: true }
      );
      expect(screen.getByText('1-30')).toBeInTheDocument();
      expect(screen.getByText('4,398')).toBeInTheDocument();
      expect(screen.getByText('1 / 147')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('changes how many entities are shown per page', () => {
      const onLimitChange = jest.fn();
      renderFooter({ page: 1, limit: 30, total: 4398, onLimitChange });
      fireEvent.click(screen.getByRole('button', { name: '30 per page' }));
      fireEvent.click(screen.getByRole('menuitem', { name: '60 per page' }));
      expect(onLimitChange).toHaveBeenCalledWith(60);
    });

    it('shows only the page control on mobile', () => {
      renderFooter({ page: 2, limit: 30, total: 4398 }, { mobile: true });
      expect(screen.getByText('2 / 147')).toBeInTheDocument();
      expect(screen.queryByText('1-30')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '30 per page' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    });

    it('hides the pager when the map shows every result', () => {
      renderFooter({ page: 1, limit: 30, total: 4398, showPagination: false });
      expect(screen.getByRole('button', { name: 'Create entity' })).toBeInTheDocument();
      expect(screen.queryByText('1-30')).not.toBeInTheDocument();
      expect(screen.queryByText('1 / 147')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });

    it('hides the mobile pager when the map shows every result', () => {
      renderFooter({ page: 2, limit: 30, total: 4398, showPagination: false }, { mobile: true });
      expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Library panes' })).toBeInTheDocument();
      expect(screen.queryByText('2 / 147')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    });
  });

  it('closes mobile menus on Escape', () => {
    renderFooter({}, { mobile: true });
    openActionsMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Actions' })).not.toBeInTheDocument();
    openPaneMenu();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: 'Library panes' })).not.toBeInTheDocument();
  });
});
