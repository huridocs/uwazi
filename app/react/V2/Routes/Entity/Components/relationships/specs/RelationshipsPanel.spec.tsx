/**
 * @jest-environment jsdom
 */
import { screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { defaultPdf, renderRelationshipsPanel } from './helpers/renderRelationshipsPanel.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const getSelectionState = () => screen.getByTestId('selection-state');

const expandAll = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Expand all' }));
};

describe('Relationships panel', () => {
  it('lists the relationships connected to the current entity', async () => {
    const user = userEvent.setup();
    renderRelationshipsPanel();

    expect(screen.getByRole('button', { name: 'Expand all' })).toBeEnabled();
    await expandAll(user);

    expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
    expect(screen.getByText('Related Entity')).toBeInTheDocument();
    expect(screen.queryByText(/alpha snippet/)).not.toBeInTheDocument();
  });

  describe('document navigation', () => {
    it('switches to the document when a text reference is selected', async () => {
      const user = userEvent.setup();
      const { onFocusDocument } = renderRelationshipsPanel({ focusDocumentOnSelect: true });

      await expandAll(user);
      await user.click(screen.getByText('Related Entity'));

      expect(onFocusDocument).toHaveBeenCalledTimes(1);
    });

    it('stays on the relationships tab when document navigation is disabled', async () => {
      const user = userEvent.setup();
      const onFocusDocument = jest.fn();
      renderRelationshipsPanel({ focusDocumentOnSelect: false, onFocusDocument });

      await expandAll(user);
      await user.click(screen.getByText('Related Entity'));

      expect(onFocusDocument).not.toHaveBeenCalled();
    });
  });

  describe('reference highlighting', () => {
    it('jumps to the quoted page and highlights the source text', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      renderRelationshipsPanel({ pdf });

      await expandAll(user);
      await user.click(screen.getByText('Related Entity'));

      expect(pdf.goToPage).toHaveBeenCalledWith(2);
      expect(
        pdf.toggleHighlights.mock.calls.some(
          ([highlights]) => Array.isArray(highlights) && highlights.length > 0
        )
      ).toBe(true);
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');
    });

    it('clears the highlight when the same reference is selected again', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      renderRelationshipsPanel({ pdf });

      await expandAll(user);
      await user.click(screen.getByText('Related Entity'));
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');

      await user.click(screen.getByText('Related Entity'));

      expect(getSelectionState().getAttribute('data-active')).toBe('');
      expect(pdf.toggleHighlights).toHaveBeenLastCalledWith([]);
    });
  });

  describe('tree view', () => {
    it('groups relationships by target entity when tree view is selected', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.click(screen.getByRole('radio', { name: 'Tree' }));

      expect(screen.getByRole('button', { name: 'Collapse all' })).toBeEnabled();
      expect(screen.getAllByText('Related Entity').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Other Entity').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('filters', () => {
    const searchInput = () => screen.getByRole('textbox', { name: /search relationships/i });
    const filtersButton = () => screen.getByRole('button', { name: /^filters/i });

    it('narrows the list to matching relationships and shows the active search', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');
      await expandAll(user);

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.queryByText('Other Entity')).not.toBeInTheDocument();
      expect(screen.getByText('"alpha"')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'true');
      expect(filtersButton()).toHaveTextContent('1');
    });

    it('restores the full list when the search chip is cleared', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');
      const chip = screen.getByText('"alpha"').parentElement;
      await user.click(within(chip!).getByRole('button', { name: 'Clear search' }));
      await expandAll(user);

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(screen.queryByText('"alpha"')).not.toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'false');
    });

    it('restores the full list when all filters are cleared', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel({ withFiltersDrawer: true });

      await user.type(searchInput(), 'alpha');
      await user.click(filtersButton());
      await user.click(screen.getByRole('button', { name: /clear all filters/i }));
      await expandAll(user);

      expect(screen.getByText(/target quoted text/)).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
