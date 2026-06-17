/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react';
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
});
