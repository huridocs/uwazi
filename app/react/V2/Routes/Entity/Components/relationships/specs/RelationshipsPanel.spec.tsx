/**
 * @jest-environment jsdom
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { defaultPdf, renderRelationshipsPanel } from './helpers/renderRelationshipsPanel.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const getSelectionState = () => screen.getByTestId('selection-state');

describe('RelationshipsPanel', () => {
  it('renders relationship rows from the entity', () => {
    renderRelationshipsPanel();

    expect(screen.getByText('alpha snippet')).toBeInTheDocument();
    expect(screen.getByText('Related Entity')).toBeInTheDocument();
  });

  describe('navigation', () => {
    it('focuses the document panel when a text reference row is selected on main', async () => {
      const user = userEvent.setup();
      const { onFocusDocument } = renderRelationshipsPanel({ focusDocumentOnSelect: true });

      await user.click(screen.getByText('alpha snippet'));

      expect(onFocusDocument).toHaveBeenCalledTimes(1);
    });

    it('does not focus the document panel when focusDocumentOnSelect is disabled', async () => {
      const user = userEvent.setup();
      const onFocusDocument = jest.fn();
      renderRelationshipsPanel({ focusDocumentOnSelect: false, onFocusDocument });

      await user.click(screen.getByText('alpha snippet'));

      expect(onFocusDocument).not.toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('navigates the PDF and highlights when a text reference row is selected', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      renderRelationshipsPanel({ pdf });

      await user.click(screen.getByText('alpha snippet'));

      expect(pdf.goToPage).toHaveBeenCalledWith(2);
      expect(pdf.toggleHighlights).toHaveBeenCalledTimes(1);
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');
    });

    it('clears selection when the same row is toggled', async () => {
      const user = userEvent.setup();
      const pdf = defaultPdf();
      renderRelationshipsPanel({ pdf });

      await user.click(screen.getByText('alpha snippet'));
      expect(getSelectionState().getAttribute('data-active')).not.toBe('');

      await user.click(screen.getByText('alpha snippet'));

      expect(getSelectionState().getAttribute('data-active')).toBe('');
      expect(pdf.toggleHighlights).toHaveBeenLastCalledWith([]);
    });
  });

  describe('filters', () => {
    const searchInput = () => screen.getByRole('textbox', { name: /search relationships/i });
    const filtersButton = () => screen.getByRole('button', { name: /^filters/i });

    it('filters markers, shows an active chip, and updates the filter count', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');

      expect(screen.getByText('alpha snippet')).toBeInTheDocument();
      expect(screen.queryByText('Other Entity')).not.toBeInTheDocument();
      expect(screen.getByText('"alpha"')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'true');
      expect(filtersButton()).toHaveTextContent('2');
    });

    it('clears search from the chip and restores all markers', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel();

      await user.type(searchInput(), 'alpha');
      const chip = screen.getByText('"alpha"').parentElement;
      await user.click(within(chip!).getByRole('button', { name: 'Clear search' }));

      expect(screen.getByText('alpha snippet')).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(screen.queryByText('"alpha"')).not.toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'true');
      expect(filtersButton()).toHaveTextContent('1');
    });

    it('clears all filters from the drawer', async () => {
      const user = userEvent.setup();
      renderRelationshipsPanel({ withFiltersDrawer: true });

      await user.type(searchInput(), 'alpha');
      await user.click(filtersButton());
      await user.click(screen.getByRole('button', { name: /clear all filters/i }));

      expect(screen.getByText('alpha snippet')).toBeInTheDocument();
      expect(screen.getByText('Other Entity')).toBeInTheDocument();
      expect(filtersButton()).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
