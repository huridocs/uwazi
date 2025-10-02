/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { FiltersSidepanel, FiltersSidepanelProps } from '../FiltersSidepanel';

const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockAggregation: FiltersSidepanelProps['aggregation'] = {
  total: 10,
  labeled: 5,
  nonLabeled: 5,
  match: 3,
  mismatch: 2,
  obsolete: 1,
  error: 0,
  noContext: 2,
  nonProcessed: 1,
  accuracy: 23,
  useForTraining: 5,
};

const renderComponent = (showSidepanel = true, aggregation = mockAggregation) => {
  const setShowSidepanel = jest.fn();
  const result = render(
    <BrowserRouter>
      <FiltersSidepanel
        showSidepanel={showSidepanel}
        setShowSidepanel={setShowSidepanel}
        aggregation={aggregation}
      />
    </BrowserRouter>
  );
  return { ...result, setShowSidepanel };
};

describe('FiltersSidepanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('should display the available filters', () => {
    renderComponent();
    expect(screen.getByText('Stats & Filters')).toBeInTheDocument();
    const options = screen.getAllByRole('group').map(option => option.parentElement?.textContent);
    expect(options).toEqual([
      'Labeled5',
      'Non-labeled5',
      'Use for training5',
      'Non processed1',
      'Obsolete1',
      'Error0',
      'Match3',
      'Mismatch2',
      'No context2',
    ]);
  });

  it('should display statistics', () => {
    renderComponent();
    expect(screen.getByText('Stats & Filters')).toBeInTheDocument();
    const statistics = screen.getAllByRole('list');
    expect(statistics[0]).toHaveTextContent(/Accuracy23%/i);
  });

  // eslint-disable-next-line max-statements
  it('should allow users to select filter options and apply them', async () => {
    const { setShowSidepanel } = renderComponent();

    const labeledCheckbox = screen.getByLabelText('Labeled');
    const nonProcessedCheckbox = screen.getByLabelText('Non processed');

    fireEvent.click(labeledCheckbox);
    expect(labeledCheckbox).toBeChecked();

    fireEvent.click(nonProcessedCheckbox);
    expect(nonProcessedCheckbox).toBeChecked();

    const applyButton = screen.getByText('Apply');
    expect(applyButton).toBeInTheDocument();
    expect(applyButton).toBeEnabled();

    await act(() => {
      fireEvent.click(applyButton);
    });

    expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function));

    const setSearchParamsCall = mockSetSearchParams.mock.calls[0][0];
    const testSearchParams = new URLSearchParams();
    setSearchParamsCall(testSearchParams);

    expect(testSearchParams.get('page')).toBe('1');
    expect(testSearchParams.get('filter')).toBe(
      JSON.stringify({
        labeled: true,
        nonLabeled: false,
        useForTraining: false,
        match: false,
        mismatch: false,
        obsolete: false,
        error: false,
        noContext: false,
        nonProcessed: true,
      })
    );

    expect(setShowSidepanel).toHaveBeenCalledWith(false);
  });

  // eslint-disable-next-line max-statements
  it('should clear all selected filters when user clicks Clear all', async () => {
    const { setShowSidepanel } = renderComponent();

    fireEvent.click(screen.getByLabelText('Labeled'));
    fireEvent.click(screen.getByLabelText('Non processed'));
    fireEvent.click(screen.getByLabelText('Match'));

    expect(screen.getByLabelText('Labeled')).toBeChecked();
    expect(screen.getByLabelText('Non processed')).toBeChecked();
    expect(screen.getByLabelText('Match')).toBeChecked();

    await act(() => {
      fireEvent.click(screen.getByText('Clear all'));
    });

    expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(Function));

    const setSearchParamsCall = mockSetSearchParams.mock.calls[0][0];
    const testSearchParams = new URLSearchParams();
    setSearchParamsCall(testSearchParams);

    expect(testSearchParams.has('filter')).toBe(false);

    expect(setShowSidepanel).toHaveBeenCalledWith(false);
  });

  it('should load initial filter state from URL params', () => {
    mockSearchParams = new URLSearchParams();
    mockSearchParams.set(
      'filter',
      JSON.stringify({
        labeled: true,
        nonLabeled: false,
        match: true,
        mismatch: false,
        obsolete: false,
        error: false,
        noContext: false,
        nonProcessed: false,
      })
    );

    renderComponent();

    expect(screen.getByLabelText('Labeled')).toBeChecked();
    expect(screen.getByLabelText('Non-labeled')).not.toBeChecked();
    expect(screen.getByLabelText('Match')).toBeChecked();
    expect(screen.getByLabelText('Mismatch')).not.toBeChecked();
  });

  it('should handle invalid JSON in URL params gracefully', () => {
    mockSearchParams = new URLSearchParams();
    mockSearchParams.set('filter', 'invalid-json');

    renderComponent();

    expect(screen.getByLabelText('Labeled')).not.toBeChecked();
    expect(screen.getByLabelText('Non-labeled')).not.toBeChecked();
    expect(screen.getByLabelText('Match')).not.toBeChecked();
  });

  it('should show/hide sidepanel based on showSidepanel prop', async () => {
    const { rerender } = renderComponent(true);
    expect(screen.getByText('Stats & Filters')).toBeInTheDocument();

    await act(async () => {
      rerender(
        <BrowserRouter>
          <FiltersSidepanel
            showSidepanel={false}
            setShowSidepanel={jest.fn()}
            aggregation={mockAggregation}
          />
        </BrowserRouter>
      );
    });

    expect(screen.queryByText('Stats & Filters')).not.toBeInTheDocument();
  });

  // eslint-disable-next-line max-statements
  it('should update individual checkbox states correctly', () => {
    renderComponent();

    const labeledCheckbox = screen.getByLabelText('Labeled');
    const matchCheckbox = screen.getByLabelText('Match');
    const mismatchCheckbox = screen.getByLabelText('Mismatch');

    expect(labeledCheckbox).not.toBeChecked();
    expect(matchCheckbox).not.toBeChecked();
    expect(mismatchCheckbox).not.toBeChecked();

    fireEvent.click(labeledCheckbox);
    expect(labeledCheckbox).toBeChecked();
    expect(matchCheckbox).not.toBeChecked();
    expect(mismatchCheckbox).not.toBeChecked();

    fireEvent.click(matchCheckbox);
    expect(labeledCheckbox).toBeChecked();
    expect(matchCheckbox).toBeChecked();
    expect(mismatchCheckbox).not.toBeChecked();

    fireEvent.click(labeledCheckbox);
    expect(labeledCheckbox).not.toBeChecked();
    expect(matchCheckbox).toBeChecked();
    expect(mismatchCheckbox).not.toBeChecked();
  });

  // eslint-disable-next-line max-statements
  it('should reset form to default values when cleared', async () => {
    renderComponent();

    fireEvent.click(screen.getByLabelText('Labeled'));
    fireEvent.click(screen.getByLabelText('Match'));
    fireEvent.click(screen.getByLabelText('Error'));

    expect(screen.getByLabelText('Labeled')).toBeChecked();
    expect(screen.getByLabelText('Match')).toBeChecked();
    expect(screen.getByLabelText('Error')).toBeChecked();

    await act(() => {
      fireEvent.click(screen.getByText('Clear all'));
    });

    expect(screen.getByLabelText('Labeled')).not.toBeChecked();
    expect(screen.getByLabelText('Match')).not.toBeChecked();
    expect(screen.getByLabelText('Error')).not.toBeChecked();
    expect(screen.getByLabelText('Non-labeled')).not.toBeChecked();
    expect(screen.getByLabelText('Mismatch')).not.toBeChecked();
    expect(screen.getByLabelText('Obsolete')).not.toBeChecked();
    expect(screen.getByLabelText('No context')).not.toBeChecked();
    expect(screen.getByLabelText('Non processed')).not.toBeChecked();
  });
});
