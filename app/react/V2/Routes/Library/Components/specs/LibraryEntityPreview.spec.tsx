/**
 * @jest-environment jsdom
 */
// oxlint-disable max-lines
// oxlint-disable max-statements
// oxlint-disable react/jsx-props-no-spreading
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import {
  isMobileOverrideAtom,
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { LibraryEntityPreview } from '../LibraryEntityPreview.js';
import { LibraryView } from '../LibraryView.js';

jest.mock('#V2/Routes/Entity/Components/relationships/overlay/EntityOverlay.js', () => ({
  EntityOverlay: () => <div data-testid="stacked-entity-overlay" />,
}));

jest.mock('#V2/Components/PDFViewer', () => ({
  ...jest.requireActual('#V2/Components/PDFViewer'),
  PDF: ({ fileUrl }: { fileUrl?: string }) => (
    <div data-testid="mock-pdf">
      PDF: {fileUrl}
      <div className="page" data-page-number="1" style={{ height: 800 }} />
    </div>
  ),
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const entityWithDocument: EntityType = {
  _id: 'ent1',
  sharedId: 'shared-doc',
  language: 'en',
  title: 'Case 11.481 (Gelman)',
  template: 'template1',
  creationDate: 0,
  user: 'user1',
  documents: [{ filename: 'file.pdf', _id: 'doc1', language: 'eng' }],
  metadata: {},
  relations: [
    { entity: 'rel-a', entityData: { title: 'Related A', template: 'template2' } },
    { entity: 'rel-b', entityData: { title: 'Related B', template: 'template2' } },
    { entity: 'rel-c', entityData: { title: 'Related C', template: 'template3' } },
  ],
};

const entityWithoutDocument: EntityType = {
  _id: 'ent2',
  sharedId: 'shared-meta',
  language: 'en',
  title: 'Mexico',
  template: 'template3',
  creationDate: 0,
  user: 'user1',
  documents: [],
  metadata: {},
  relations: [],
};

const emptyAggregations: LibraryAggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
};

const getBySharedId = jest.fn();

let mediaMock = setupMatchMediaMock();

const adminUser = { _id: '1', role: 'admin', name: 'admin' };

type PreviewRenderOptions = {
  onClose?: () => void;
  user?: typeof adminUser;
  focusFieldKey?: string;
  mobile?: boolean;
  onAction?: () => void;
};

const renderPreview = (sharedId: string, options: PreviewRenderOptions = {}) => {
  const onClose = options.onClose ?? jest.fn();
  const { user, focusFieldKey, mobile, onAction } = options;
  return render(
    <TestRouterContext>
      <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'en'],
            [templatesAtom, templates],
            [translationsAtom, translations],
            [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
            ...(user ? [[userAtom, user] as const] : []),
            ...(mobile ? [[isMobileOverrideAtom, true] as const] : []),
          ]}
        >
          <LibraryEntityPreview
            sharedId={sharedId}
            entityBasePath="/entityv2"
            onClose={onClose}
            focusFieldKey={focusFieldKey}
            onAction={onAction}
          />
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );
};

describe('LibraryEntityPreview', () => {
  beforeEach(() => {
    getBySharedId.mockImplementation(async (sharedId: string) => {
      if (sharedId === entityWithDocument.sharedId) return [[entityWithDocument]];
      if (sharedId === entityWithoutDocument.sharedId) return [[entityWithoutDocument]];
      return [undefined];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  it('shows the entity viewer left tabs and the PDF when the entity has a document', async () => {
    renderPreview(entityWithDocument.sharedId);

    expect(await screen.findByRole('tab', { name: 'Document' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Relationships/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Files/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'ToC' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'File' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Translations' })).not.toBeInTheDocument();

    const pdf = await screen.findByTestId('mock-pdf');
    expect(pdf).toHaveTextContent('/api/files/file.pdf');
    expect(screen.getByText('Case 11.481 (Gelman)')).toBeInTheDocument();
  });

  it('opens ToC in the preview when that tab is selected', async () => {
    renderPreview(entityWithDocument.sharedId);
    fireEvent.click(await screen.findByRole('tab', { name: 'ToC' }));
    expect(screen.getByRole('tab', { name: 'ToC' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Document' })).toHaveAttribute('aria-selected', 'false');
  });

  it('switches to the Metadata tab using the entity viewer tabs', async () => {
    renderPreview(entityWithDocument.sharedId);
    const documentTab = await screen.findByRole('tab', { name: 'Document' });
    fireEvent.click(screen.getByRole('tab', { name: 'Metadata' }));
    expect(screen.getByRole('tab', { name: 'Metadata' })).toHaveAttribute('aria-selected', 'true');
    expect(documentTab).toHaveAttribute('aria-selected', 'false');
  });

  it('opens the Metadata tab when a table cell asks to focus a property', async () => {
    renderPreview(entityWithDocument.sharedId, { focusFieldKey: 'title' });
    expect(await screen.findByRole('tab', { name: 'Metadata' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('hides the Document tab when the entity has no document', async () => {
    renderPreview(entityWithoutDocument.sharedId);

    expect(await screen.findByRole('tab', { name: 'Metadata' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Relationships/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Files/ })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-pdf')).not.toBeInTheDocument();
  });

  it('closes from the footer, the header button, and Escape', async () => {
    const onClose = jest.fn();
    renderPreview(entityWithDocument.sharedId, { onClose });
    await screen.findByText('Case 11.481 (Gelman)');

    const footer = await screen.findByTestId('entity-tab-footer');
    fireEvent.click(within(footer).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('mounts the entity overlay so a related entity can stack', async () => {
    renderPreview(entityWithDocument.sharedId);
    expect(await screen.findByTestId('stacked-entity-overlay')).toBeInTheDocument();
  });

  it('mounts the entity overlay on mobile so a related entity can stack', async () => {
    renderPreview(entityWithDocument.sharedId, { mobile: true });
    expect(await screen.findByTestId('stacked-entity-overlay')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
  });

  it('links View entity to the entity viewer path', async () => {
    renderPreview(entityWithDocument.sharedId);
    const link = await screen.findByRole('link', { name: /View entity/ });
    expect(link).toHaveAttribute('href', '/en/entityv2/shared-doc');
  });

  it('shows Edit on Metadata, then Copy from, Cancel and Save when editing', async () => {
    renderPreview(entityWithoutDocument.sharedId, { user: adminUser, onAction: jest.fn() });

    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(within(footer).getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
    expect(within(footer).getByRole('button', { name: 'Edit' }).querySelector('svg')).toBeNull();

    fireEvent.click(within(footer).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy from/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View entity/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(within(footer).getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows the active tab footer while a metadata edit stays open', async () => {
    renderPreview(entityWithDocument.sharedId, { user: adminUser, onAction: jest.fn() });

    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^Relationships/ }));
    const footer = screen.getByTestId('library-entity-preview-footer');
    fireEvent.click(within(footer).getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('button', { name: 'Create relationship' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Metadata' }));
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy from/ })).toBeInTheDocument();
  });

  it('confirms before canceling dirty metadata edits', async () => {
    renderPreview(entityWithoutDocument.sharedId, { user: adminUser, onAction: jest.fn() });

    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(await screen.findByLabelText(/Title/), { target: { value: 'Changed' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Unsaved changes')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-button'));
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(await screen.findByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('stays on Relationships and shows the relationships toolbar after Edit', async () => {
    renderPreview(entityWithDocument.sharedId, { user: adminUser, onAction: jest.fn() });
    fireEvent.click(await screen.findByRole('tab', { name: /^Relationships/ }));
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveClass('bg-paper');
    expect(panel).not.toHaveClass('bg-warm');

    const footer = screen.getByTestId('library-entity-preview-footer');
    expect(within(footer).getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
    fireEvent.click(within(footer).getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('tab', { name: /^Relationships/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(await screen.findByRole('button', { name: 'Create relationship' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Manage types' }));
    expect(
      await screen.findByRole('dialog', { name: 'Manage relationship types' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('tab', { name: /^Relationships/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      within(screen.getByTestId('library-entity-preview-footer')).getByRole('button', {
        name: 'Edit',
      })
    ).toBeInTheDocument();
  });

  it('exits relationship edit when leaving the Relationships tab', async () => {
    renderPreview(entityWithDocument.sharedId, { user: adminUser, onAction: jest.fn() });
    fireEvent.click(await screen.findByRole('tab', { name: /^Relationships/ }));
    fireEvent.click(
      within(screen.getByTestId('library-entity-preview-footer')).getByRole('button', {
        name: 'Edit',
      })
    );
    expect(await screen.findByRole('button', { name: 'Create relationship' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Metadata' }));
    fireEvent.click(screen.getByRole('tab', { name: /^Relationships/ }));

    const footer = screen.getByTestId('library-entity-preview-footer');
    expect(within(footer).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create relationship' })).not.toBeInTheDocument();
  });

  it('shows page controls, Close and View entity on Document', async () => {
    renderPreview(entityWithDocument.sharedId, { user: adminUser, onAction: jest.fn() });
    expect(await screen.findByRole('tab', { name: 'Document' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    const footer = await screen.findByTestId('entity-tab-footer');
    expect(within(footer).getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(footer.firstElementChild?.firstElementChild).toContainElement(
      within(footer).getByRole('button', { name: 'Previous' })
    );
    expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /View entity/ })).toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: 'Permissions' })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(footer.firstElementChild).toHaveClass('flex-wrap');
  });

  it('shows the side-pane file list instead of the wide table', async () => {
    renderPreview(entityWithoutDocument.sharedId);
    fireEvent.click(await screen.findByRole('tab', { name: /Files/ }));
    expect(await screen.findByText('No primary documents')).toBeInTheDocument();
    expect(
      screen.getByText('No supporting files yet. Add a file to get started.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select all files' })).not.toBeInTheDocument();
    expect(screen.queryByText('File name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('opens the file preview from View and offers download on each row', async () => {
    renderPreview(entityWithDocument.sharedId);
    fireEvent.click(await screen.findByRole('tab', { name: /Files/ }));
    expect(await screen.findByText('file.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select all files' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download file.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View file.pdf' }).parentElement).not.toHaveClass(
      'border-ink/30'
    );

    fireEvent.click(screen.getByRole('button', { name: 'View file.pdf' }));
    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(await screen.findByRole('button', { name: 'Back to files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /View entity/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
  });

  it('keeps both file bars on a narrow screen', async () => {
    renderPreview(entityWithDocument.sharedId, { mobile: true, onAction: jest.fn() });
    fireEvent.click(await screen.findByRole('button', { name: 'Entity primary' }));
    fireEvent.click(await screen.findByRole('option', { name: /Files/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'View file.pdf' }));
    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(screen.getByRole('button', { name: 'Back to files' })).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /View entity/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps Close and View entity on Files without Edit', async () => {
    renderPreview(entityWithDocument.sharedId, { user: adminUser, onAction: jest.fn() });
    fireEvent.click(await screen.findByRole('tab', { name: /Files/ }));

    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(within(footer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: /Add file/ })).not.toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: /View entity/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add translation' })).toBeInTheDocument();
  });

  it('does not offer Add file on Metadata', async () => {
    renderPreview(entityWithoutDocument.sharedId, { user: adminUser });
    fireEvent.click(await screen.findByRole('tab', { name: 'Metadata' }));
    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(within(footer).queryByRole('button', { name: /Add file/ })).not.toBeInTheDocument();
  });

  it('does not offer Add file to guests on Files', async () => {
    renderPreview(entityWithoutDocument.sharedId);
    fireEvent.click(await screen.findByRole('tab', { name: /Files/ }));
    const footer = await screen.findByTestId('library-entity-preview-footer');
    expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(footer).queryByRole('button', { name: /Add file/ })).not.toBeInTheDocument();
  });

  it('shows an empty state when the entity cannot be loaded', async () => {
    renderPreview('missing');
    expect(await screen.findByText('NO DATA AVAILABLE')).toBeInTheDocument();
  });
});

describe('LibraryView preview pane', () => {
  beforeEach(() => {
    getBySharedId.mockResolvedValue([[entityWithDocument]]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  const viewProps = {
    rows: [],
    totalRows: 0,
    aggregations: emptyAggregations,
    search: '',
    onSearchChange: jest.fn(),
    view: 'cards' as const,
    onViewChange: jest.fn(),
    sort: '',
    order: 'desc' as const,
    onSortChange: jest.fn(),
    filters: {},
    onFiltersChange: jest.fn(),
    andFilters: [],
    onAndFiltersChange: jest.fn(),
    chips: [],
    onSelectedIdsChange: jest.fn(),
    onClosePreview: jest.fn(),
    entityBasePath: '/entityv2',
  };

  const renderView = (selectedId?: string) =>
    render(
      <TestRouterContext>
        <ServicesProvider value={createTestServices({ entities: { getBySharedId } })}>
          <TestAtomStoreProvider
            initialValues={[
              [localeAtom, 'en'],
              [templatesAtom, templates],
              [translationsAtom, translations],
              [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
              [userAtom, { _id: 'admin1', role: 'admin', username: 'admin', email: 'a@b.c' }],
            ]}
          >
            <LibraryView
              {...viewProps}
              rows={
                selectedId
                  ? [
                      {
                        _id: entityWithDocument._id,
                        sharedId: entityWithDocument.sharedId,
                        language: entityWithDocument.language,
                        title: entityWithDocument.title,
                        template: entityWithDocument.template,
                        metadata: {},
                      },
                    ]
                  : []
              }
              selectedIds={selectedId ? [selectedId] : []}
            />
          </TestAtomStoreProvider>
        </ServicesProvider>
      </TestRouterContext>
    );

  it('shows filters when no entity is selected', async () => {
    renderView();
    expect(await screen.findByRole('tab', { name: 'Filters' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByTestId('library-entity-preview')).not.toBeInTheDocument();
  });

  it('shows the entity preview instead of filters when an entity is selected', async () => {
    renderView(entityWithDocument.sharedId);
    expect(await screen.findByText('Case 11.481 (Gelman)')).toBeInTheDocument();
    expect(screen.getByTestId('library-entity-preview')).toBeInTheDocument();
    expect(screen.queryByTestId('library-selection-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });

  it('opens an empty entity form in the right panel', async () => {
    renderView();
    fireEvent.click(await screen.findByRole('button', { name: 'Create entity' }));
    expect(await screen.findByTestId('library-create-entity')).toBeInTheDocument();
    expect(screen.getByText('New entity')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue('');
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
  });

  it('opens the native PDF file picker without a modal', async () => {
    renderView();
    const upload = await screen.findByRole('button', { name: 'Upload PDF' });
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);
    const openPicker = jest.spyOn(input as HTMLInputElement, 'click');
    fireEvent.click(upload);
    expect(openPicker).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Upload PDF' })).not.toBeInTheDocument();
  });
});
