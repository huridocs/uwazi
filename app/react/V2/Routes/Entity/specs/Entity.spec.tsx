/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { settingsAtom, templatesAtom, userAtom, relationshipTypesAtom } from '#V2/atoms/index.js';
import * as utils from '#app/utils/index.js';
import * as files from '#V2/api/files/index.js';
import * as searchApi from '#V2/api/search/index.js';
import { Entity } from '../Entity.js';
import { entityLoaderCache } from '../EntityLoaderCache.js';
import { entityWithRelations } from '../Components/relationships/specs/fixtures/entityWithRelations.js';
import { relationshipQueryFromEntity } from '../Components/relationships/specs/helpers/relationshipQueryFromEntity.js';

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

  constructor(_callback: ResizeObserverCallback) {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const sampleEntity: Partial<EntityType> = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Sample Entity',
  template: 'template1',
  documents: [{ filename: 'file.pdf', _id: '1', language: 'eng' }],
  metadata: {},
};

const sampleMainDocument = sampleEntity.documents![0];

const sampleTemplate = [
  { _id: 'template1', name: 'Template 1', properties: [], commonProperties: [] },
];

const adminUser = { _id: '1', role: 'admin', name: 'admin' };

let mediaMock = setupMatchMediaMock();

type RenderEntityOptions = {
  entity?: Partial<EntityType>;
  mainDocument?: typeof sampleMainDocument | undefined;
  pagePlaintext?: string;
  initialEntries?: string[];
  settings?: Record<string, unknown>;
  user?: typeof adminUser;
  withServices?: boolean;
  relationshipTypes?: Array<{ _id: string; name: string }>;
};

const renderEntity = (options: RenderEntityOptions = {}) => {
  const {
    entity = sampleEntity,
    pagePlaintext = '',
    initialEntries,
    settings,
    user,
    withServices = false,
    relationshipTypes,
  } = options;
  const mainDocument = Object.hasOwn(options, 'mainDocument')
    ? options.mainDocument
    : sampleMainDocument;

  window.history.replaceState({}, '', initialEntries?.[0] ?? '/');

  const atoms: Array<
    readonly [
      typeof templatesAtom | typeof settingsAtom | typeof userAtom | typeof relationshipTypesAtom,
      unknown,
    ]
  > = [[templatesAtom, sampleTemplate]];
  if (settings !== undefined) {
    atoms.push([settingsAtom, settings]);
  }
  if (user) {
    atoms.push([userAtom, user]);
  }
  if (relationshipTypes) {
    atoms.push([relationshipTypesAtom, relationshipTypes]);
  }

  const relationshipQuery =
    entity.language && entity.sharedId && entity.title && entity.template
      ? relationshipQueryFromEntity(
          {
            language: entity.language,
            sharedId: entity.sharedId,
            title: entity.title,
            template: entity.template,
            relations: entity.relations,
          },
          mainDocument?._id
        )
      : undefined;

  const tree = (
    <TestRouterContext
      loaderData={{
        entity,
        mainDocument,
        pagePlaintext,
        relationshipQuery,
      }}
      initialEntries={initialEntries}
    >
      <TestAtomStoreProvider initialValues={atoms}>
        <Entity />
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

  return render(
    withServices ? <ServicesProvider value={createTestServices()}>{tree}</ServicesProvider> : tree
  );
};

const checkEntityRendered = async () => {
  expect((await screen.findAllByText('Sample Entity')).length).toBeGreaterThan(0);
};

const relationshipsSideTab = /^Relationships/;
const relationshipsMainTab = /^Relationships/;

const selectPlainTextView = (container?: HTMLElement) => {
  const scope = container ? within(container) : screen;
  fireEvent.click(scope.getByRole('button', { name: 'View' }));
  fireEvent.click(scope.getByRole('menuitem', { name: 'Plain text' }));
};

const mainTablist = () => within(screen.getAllByTestId('tabs-comp')[0]);
const sideTablist = () => within(screen.getAllByTestId('tabs-comp')[1]);

describe('Entity view', () => {
  afterEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  it('should show loading when no entity', async () => {
    render(
      <TestRouterContext loaderData={undefined}>
        <Entity />
      </TestRouterContext>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should render PDF and metadata', async () => {
    renderEntity();
    await checkEntityRendered();

    const pdf = await screen.findByTestId('mock-pdf');
    expect(pdf).toBeInTheDocument();
    expect(pdf).toHaveTextContent('/api/files/file.pdf');
  });

  describe('OCR service', () => {
    beforeAll(() => {
      jest.spyOn(files, 'getOcrStatus').mockResolvedValue({ status: files.OcrStatus.NONE });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should not display the OCR button when the service is not availabe', async () => {
      renderEntity({ settings: {}, user: adminUser });
      await checkEntityRendered();
      expect(screen.queryByText('OCR PDF')).not.toBeInTheDocument();
    });

    it('should not display if there is no user', async () => {
      renderEntity({ settings: { ocrServiceEnabled: true } });
      await checkEntityRendered();
      expect(screen.queryByText('OCR PDF')).not.toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    beforeEach(async () => {
      renderEntity();
      await checkEntityRendered();
    });

    it('renders main and side tabs; side tabs follow the active main tab', async () => {
      expect(mainTablist().getByRole('tab', { name: 'Document' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(mainTablist().getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
      expect(mainTablist().getByRole('tab', { name: relationshipsMainTab })).toBeInTheDocument();
      expect(mainTablist().getByRole('tab', { name: /Files/ })).toBeInTheDocument();

      expect(sideTablist().getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
      expect(sideTablist().getByRole('tab', { name: 'ToC' })).toBeInTheDocument();
      expect(sideTablist().getByRole('tab', { name: relationshipsSideTab })).toBeInTheDocument();
      expect(sideTablist().getByRole('tab', { name: 'Search' })).toBeInTheDocument();

      fireEvent.click(mainTablist().getByRole('tab', { name: 'Metadata' }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'Document' })).toBeInTheDocument();
        expect(sideTablist().queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
        expect(sideTablist().queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: relationshipsSideTab })).toBeInTheDocument();
      });

      fireEvent.click(mainTablist().getByRole('tab', { name: relationshipsMainTab }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'Document' })).toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: /Files/ })).toBeInTheDocument();
        expect(sideTablist().queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
        expect(
          sideTablist().queryByRole('tab', { name: relationshipsSideTab })
        ).not.toBeInTheDocument();
      });

      fireEvent.click(mainTablist().getByRole('tab', { name: /Files/ }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'File' })).toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: 'Translations 1' })).toBeInTheDocument();
      });
    });

    it('hides the entity header when Document is shown in the side panel', async () => {
      fireEvent.click(mainTablist().getByRole('tab', { name: 'Metadata' }));

      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      const sideDocumentPanel = document.getElementById('entity-side-panel-document');
      expect(sideDocumentPanel).not.toBeNull();
      if (!(sideDocumentPanel instanceof HTMLElement)) {
        throw new Error('expected side document panel');
      }
      expect(within(sideDocumentPanel).queryByText('Sample Entity')).toBeNull();
      expect(within(sideDocumentPanel).getByRole('button', { name: 'View' })).toBeInTheDocument();
      expect(within(sideDocumentPanel).getByTestId('mock-pdf')).toBeInTheDocument();
    });

    it('preserves supported side tab and resets unsupported side tab across main switches', async () => {
      const user = userEvent.setup();
      fireEvent.click(sideTablist().getByRole('tab', { name: relationshipsSideTab }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: relationshipsSideTab })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      fireEvent.click(mainTablist().getByRole('tab', { name: 'Metadata' }));
      await waitFor(() => {
        expect(mainTablist().getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(sideTablist().getByRole('tab', { name: relationshipsSideTab })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      fireEvent.click(mainTablist().getByRole('tab', { name: 'Document' }));
      await waitFor(() => {
        expect(mainTablist().getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(sideTablist().getByRole('tab', { name: relationshipsSideTab })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(sideTablist().getByRole('tab', { name: 'ToC' })).toBeInTheDocument();
      });

      await user.click(sideTablist().getByRole('tab', { name: 'ToC' }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'ToC' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      fireEvent.click(mainTablist().getByRole('tab', { name: 'Metadata' }));
      await waitFor(() => {
        expect(sideTablist().queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });
  });

  describe('metadata editing session', () => {
    it('keeps dirty draft when editing on side then opening main Metadata', async () => {
      renderEntity({ user: adminUser, withServices: true });
      await checkEntityRendered();

      fireEvent.click(sideTablist().getByRole('tab', { name: 'Metadata' }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      const titleInput = await screen.findByRole('textbox', { name: /Title/ });
      fireEvent.change(titleInput, { target: { value: 'Dirty from side' } });
      expect(titleInput).toHaveValue('Dirty from side');

      fireEvent.click(mainTablist().getByRole('tab', { name: 'Metadata' }));
      await waitFor(() => {
        expect(screen.getByTestId('entity-edit-form')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Dirty from side');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      });

      const metadataTab = mainTablist().getByRole('tab', { name: /Metadata/ });
      expect(within(metadataTab).getByTestId('accent-dot')).toBeInTheDocument();
    });
  });

  describe('Plain text view', () => {
    const pageText = 'This is the plain text';

    beforeAll(() => {
      jest.spyOn(files, 'getDocumentPlaintext').mockResolvedValue(pageText);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should switch to plain text view', async () => {
      renderEntity({ pagePlaintext: pageText });
      await checkEntityRendered();

      expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();
      expect(
        screen.getByText('This is the plain text').closest('.overflow-auto')?.classList
      ).toContain('hidden');

      selectPlainTextView();

      await waitFor(() => {
        expect(screen.getByText(pageText).closest('.overflow-auto')?.classList).toContain('block');
        expect(screen.getByRole('region', { name: 'Page 1' })).toHaveAttribute('id', 'page1');
      });
    });

    it('should render the plain text view on SSR', async () => {
      jest.replaceProperty(utils, 'isClient', false);

      renderEntity({ pagePlaintext: pageText });
      await checkEntityRendered();

      await waitFor(() => {
        expect(screen.getByText(pageText).closest('.overflow-auto')?.classList).toContain('block');
      });

      jest.restoreAllMocks();
    });
  });

  describe('Relationships SSR index', () => {
    const mainDocument = { filename: 'file.pdf', _id: 'f1', language: 'eng' };
    const entity = {
      ...entityWithRelations,
      title: 'Sample Entity',
      documents: [mainDocument],
      metadata: {},
    };
    const relationshipTypes = [{ _id: 'relA', name: 'Related' }];
    const renderRelationshipsEntity = (options: Omit<RenderEntityOptions, 'entity'> = {}) =>
      renderEntity({ entity, mainDocument, relationshipTypes, ...options });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('includes hidden relationship links on SSR and not the interactive panel', async () => {
      jest.replaceProperty(utils, 'isClient', false);
      renderRelationshipsEntity({
        initialEntries: ['/?m=relationships'],
      });

      await checkEntityRendered();

      const index = screen.getByTestId('entity-relationships-ssr-index');
      expect(index).not.toBeVisible();
      expect(
        within(index).getByRole('heading', { name: 'Related', hidden: true })
      ).toBeInTheDocument();
      expect(
        within(index).getByRole('link', { name: 'Related Entity', hidden: true })
      ).toHaveAttribute('href', '/entityv2/target-entity');
      expect(screen.queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument();
    });

    it('keeps crawlable relationship links on the default entity page', async () => {
      jest.replaceProperty(utils, 'isClient', false);
      renderRelationshipsEntity();

      await checkEntityRendered();

      const seoIndex = screen.getByTestId('entity-seo-relationships-index');
      expect(
        within(seoIndex).getByRole('link', { name: 'Related Entity', hidden: true })
      ).toHaveAttribute('href', '/entityv2/target-entity');
      expect(screen.queryByTestId('entity-relationships-ssr-index')).not.toBeInTheDocument();
    });

    it('replaces the SSR list with the interactive panel on the client', async () => {
      renderRelationshipsEntity();

      await checkEntityRendered();
      fireEvent.click(mainTablist().getByRole('tab', { name: relationshipsMainTab }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expand all' })).toBeInTheDocument();
      });
      expect(screen.queryByTestId('entity-relationships-ssr-index')).not.toBeInTheDocument();
      expect(screen.getByTestId('entity-seo-relationships-index')).toBeInTheDocument();
    });
  });

  describe('Entity without mainDocument', () => {
    it('does not render Document tab and defaults to Metadata', async () => {
      const entityNoDoc = { ...sampleEntity, documents: undefined };

      renderEntity({ entity: entityNoDoc, mainDocument: undefined });
      await checkEntityRendered();

      expect(mainTablist().queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
      expect(mainTablist().getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('shows Metadata and Files side tabs when Relationships is on main', async () => {
      const entityNoDoc = { ...sampleEntity, documents: undefined };

      renderEntity({ entity: entityNoDoc, mainDocument: undefined });
      await checkEntityRendered();

      fireEvent.click(mainTablist().getByRole('tab', { name: relationshipsMainTab }));
      await waitFor(() => {
        expect(sideTablist().getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
        expect(sideTablist().getByRole('tab', { name: /Files/ })).toBeInTheDocument();
        expect(sideTablist().queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
      });
    });

    it('should render the Files tab when the entity has no files', async () => {
      const entityNoFiles = {
        ...sampleEntity,
        documents: [],
        attachments: [],
      } as EntityType;

      renderEntity({ entity: entityNoFiles, mainDocument: undefined, user: adminUser });
      await checkEntityRendered();

      expect(mainTablist().getByRole('tab', { name: /Files/ })).toBeInTheDocument();
      fireEvent.click(mainTablist().getByRole('tab', { name: /Files/ }));

      await waitFor(() => {
        expect(mainTablist().getByRole('tab', { name: /Files/ })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(screen.getByRole('button', { name: /Add file/ })).toBeInTheDocument();
      });
    });
  });

  describe('search tab', () => {
    it('should be shown by default when there is a search in the URL', async () => {
      renderEntity({
        mainDocument: undefined,
        initialEntries: ['/#s=search&searchTerm=term'],
      });
      await checkEntityRendered();

      const input = screen.getByRole('textbox', { name: 'Search this document' });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('term');
      expect(screen.getByRole('button', { name: /Search tips/i })).toBeInTheDocument();
    });

    it('should show seach results', async () => {
      const snippetsData = {
        data: [
          {
            _id: 's1',
            snippets: {
              count: 3,
              metadata: [
                { field: 'title', texts: ['<b>Match title</b>'] },
                {
                  field: 'metadata.description.value',
                  texts: [
                    'duties in the name of <b>Honduras</b> who were reportedly carrying out their',
                  ],
                },
              ],
              fullText: [{ page: 3, text: 'Excerpt <b>match</b>' }],
            },
          },
        ],
      };
      entityLoaderCache.setSearchResults('shared1', 'en:1', 'search', snippetsData);
      jest.spyOn(searchApi, 'snippets').mockResolvedValue(snippetsData);

      renderEntity({ initialEntries: ['/#s=search&searchTerm=search'] });
      await checkEntityRendered();

      expect(await screen.findByText('Match title')).toBeInTheDocument();
      expect(screen.getByText('Properties')).toBeInTheDocument();
      expect(screen.getAllByText('Document').length).toBeGreaterThan(0);
      expect(screen.getByText(/p\.3/)).toBeInTheDocument();
      expect(
        screen.getByText(
          (_content, el) =>
            Boolean(el?.classList.contains('text-micro')) &&
            (el?.textContent?.includes('3 matches for') ?? false)
        )
      ).toBeInTheDocument();

      const marks = document.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);
      expect(marks[0]?.className).toContain('rounded-[2px]');
      expect(marks[0]?.className).toContain('color-theme-highlight-yellow-active');
      expect(marks[0]?.className).toContain('!shadow-none');
      expect(marks[0]?.className.includes('shadow-[0_0_0')).toBe(false);

      expect(screen.getByRole('button', { name: /Search tips/i })).toBeInTheDocument();

      const windowed = screen.getByText(/duties in the name of/);
      expect(windowed.textContent?.startsWith('… ')).toBe(true);
      expect(windowed.textContent?.endsWith(' …')).toBe(true);
    });

    it('property click keeps side Search and switches main to Metadata', async () => {
      const snippetsData = {
        data: [
          {
            _id: 's1',
            snippets: {
              count: 1,
              metadata: [{ field: 'title', texts: ['<b>Match title</b>'] }],
              fullText: [],
            },
          },
        ],
      };
      entityLoaderCache.setSearchResults('shared1', 'en:1', 'search', snippetsData);
      jest.spyOn(searchApi, 'snippets').mockResolvedValue(snippetsData);

      renderEntity({ initialEntries: ['/?m=document#s=search&searchTerm=search'] });
      await checkEntityRendered();

      expect(await screen.findByText('Match title')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Match title/i }));

      await waitFor(() => {
        expect(mainTablist().getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(sideTablist().getByRole('tab', { name: 'Search' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });

    it('document snippet click keeps side Search and switches main to Document', async () => {
      const snippetsData = {
        data: [
          {
            _id: 's1',
            snippets: {
              count: 1,
              metadata: [],
              fullText: [{ page: 3, text: 'Excerpt <b>match</b>' }],
            },
          },
        ],
      };
      entityLoaderCache.setSearchResults('shared1', 'en:1', 'search', snippetsData);
      jest.spyOn(searchApi, 'snippets').mockResolvedValue(snippetsData);

      renderEntity({ initialEntries: ['/?m=metadata#s=search&searchTerm=search'] });
      await checkEntityRendered();

      expect(await screen.findByText(/p\.3/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Page 3/i }));

      await waitFor(() => {
        expect(mainTablist().getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(sideTablist().getByRole('tab', { name: 'Search' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });
  });
});
