/**
 * @jest-environment jsdom
 */
import { screen, within, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { defaultPdf, renderRelationshipsPanel } from './helpers/renderRelationshipsPanel.js';
import { entityWithRelations } from './fixtures/entityWithRelations.js';
import * as utils from '#app/utils/index.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const getSelectionState = () => screen.getByTestId('selection-state');

const expandAll = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Expand all' }));
};

const clickReference = async (user: UserEvent) => {
  await user.click(screen.getByText(/target quoted text/));
};

describe('Relationships panel', () => {
  it('lists the relationships connected to the current entity', async () => {
    const user = userEvent.setup();
    const { waitForResolved } = renderRelationshipsPanel();

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeEnabled();
    await expandAll(user);
    await waitForResolved();

    expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
    expect(screen.getByText('Related Entity')).toBeInTheDocument();
    expect(screen.queryByText(/alpha snippet/)).not.toBeInTheDocument();
  });

  describe('document navigation', () => {
    it('switches to the document when a text reference is selected', async () => {
      const user = userEvent.setup();
      const { onFocusDocument, waitForResolved } = renderRelationshipsPanel({
        focusDocumentOnSelect: true,
      });

      await expandAll(user);
      await waitForResolved();
      await clickReference(user);

      expect(onFocusDocument).toHaveBeenCalledTimes(1);
    });

    it('stays on the relationships tab when document navigation is disabled', async () => {
      const user = userEvent.setup();
      const onFocusDocument = jest.fn();
      const { waitForResolved } = renderRelationshipsPanel({
        focusDocumentOnSelect: false,
        onFocusDocument,
      });

      await expandAll(user);
      await waitForResolved();
      await clickReference(user);

      expect(onFocusDocument).not.toHaveBeenCalled();
    });
  });

  describe('reference highlighting', () => {
    it('jumps to the quoted page and highlights the source text', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      const { waitForResolved } = renderRelationshipsPanel({ pdf });

      await expandAll(user);
      await waitForResolved();
      await clickReference(user);

      expect(pdf.goToPage).toHaveBeenCalledWith(2);
      expect(
        pdf.toggleHighlights.mock.calls.some(
          ([highlights]) => Array.isArray(highlights) && highlights.length > 0
        )
      ).toBe(true);
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');
    });

    it('highlights every selection rectangle after resolved loads', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      const { waitForResolved } = renderRelationshipsPanel({
        pdf,
        mainDocument: { _id: 'f1', filename: 'doc.pdf' },
      });

      await expandAll(user);
      await waitForResolved();
      await clickReference(user);

      await waitFor(() => {
        const multiRectCall = pdf.toggleHighlights.mock.calls.find(([highlights]) => {
          const pageHighlights = highlights?.[0]?.[2];
          return pageHighlights?.[0]?.textSelection?.selectionRectangles?.length === 2;
        });
        expect(multiRectCall).toBeDefined();
      });
    });

    it('clears the highlight when the same reference is selected again', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      const { waitForResolved } = renderRelationshipsPanel({ pdf });

      await expandAll(user);
      await waitForResolved();
      await clickReference(user);
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');

      await clickReference(user);

      expect(getSelectionState().getAttribute('data-active')).toBe('');
      expect(pdf.toggleHighlights).toHaveBeenLastCalledWith([]);
    });
  });

  describe('resolved fetch triggers', () => {
    it('does not load resolved hubs when the relationships panel mounts', () => {
      const { loadResolved } = renderRelationshipsPanel();
      expect(loadResolved).not.toHaveBeenCalled();
    });

    it('loads resolved when Expand all is clicked', async () => {
      const user = userEvent.setup();
      const { loadResolved, waitForResolved } = renderRelationshipsPanel();

      await expandAll(user);
      await waitForResolved();

      expect(loadResolved).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
    });

    it('shows reference text when a relationship group is expanded', async () => {
      const user = userEvent.setup();
      const { waitForResolved } = renderRelationshipsPanel();

      await user.click(screen.getByRole('button', { name: 'Related 2' }));
      await waitForResolved();

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
    });

    it('does not load resolved when switching to tree view', async () => {
      const user = userEvent.setup();
      const { loadResolved } = renderRelationshipsPanel();

      await user.click(screen.getByRole('radio', { name: 'Tree' }));

      expect(loadResolved).not.toHaveBeenCalled();
    });
  });

  describe('tree view', () => {
    it('groups relationships by target entity when tree view is selected', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.click(screen.getByRole('radio', { name: 'Tree' }));
      await expandAll(user);

      expect(screen.getByRole('button', { name: 'Expand all' })).toBeEnabled();
      expect(screen.getAllByText('Related Entity').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Other Entity').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('filters', () => {
    const searchInput = () => screen.getByRole('textbox', { name: /search relationships/i });
    const filtersButton = () => screen.getByRole('button', { name: /^filters/i });

    it('narrows the list to matching relationships and shows the active search', async () => {
      const user = userEvent.setup();
      const { waitForResolved } = renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');
      await expandAll(user);
      await waitForResolved();

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.queryByText('Other Entity')).not.toBeInTheDocument();
      expect(screen.getByText('"alpha"')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'true');
      expect(filtersButton()).toHaveTextContent('1');
    });

    it('restores the full list when the search chip is cleared', async () => {
      const user = userEvent.setup();
      const { waitForResolved } = renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');
      const chip = screen.getByText('"alpha"').parentElement;
      await user.click(within(chip!).getByRole('button', { name: 'Clear search' }));
      await expandAll(user);
      await waitForResolved();

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(screen.queryByText('"alpha"')).not.toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'false');
    });

    it('restores the full list when all filters are cleared', async () => {
      const user = userEvent.setup();
      const { waitForResolved } = renderRelationshipsPanel({ withFiltersDrawer: true });

      await user.type(searchInput(), 'alpha');
      await user.click(filtersButton());
      await user.click(screen.getByRole('button', { name: /clear all filters/i }));
      await expandAll(user);
      await waitForResolved();

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('SSR index', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('renders a hidden grouped list instead of the interactive panel', () => {
      jest.replaceProperty(utils, 'isClient', false);
      renderRelationshipsPanel();

      const index = screen.getByTestId('entity-relationships-ssr-index');
      expect(index).not.toBeVisible();
      expect(screen.getByRole('heading', { name: 'Related', hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Related Entity', hidden: true })).toHaveAttribute(
        'href',
        '/entityv2/target-entity'
      );
      expect(screen.getByRole('link', { name: 'Other Entity', hidden: true })).toHaveAttribute(
        'href',
        '/entityv2/other-entity'
      );
      expect(screen.queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument();
    });
  });

  it('shows the blank state when the entity has no relationships', () => {
    renderRelationshipsPanel({
      entity: { ...entityWithRelations, relations: [] },
    });

    expect(screen.getByText('No Relationships')).toBeInTheDocument();
  });
});
