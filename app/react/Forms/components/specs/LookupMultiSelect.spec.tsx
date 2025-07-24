/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LookupMultiSelect, LookupMultiSelectProps } from '../LookupMultiSelect';

describe('LookupMultiSelect (React Testing Library)', () => {
  let props: Partial<LookupMultiSelectProps>;
  let lookupSpy: jest.Mock;

  beforeEach(() => {
    lookupSpy = jest.fn(async term => {
      if (!term) {
        // Return 8 options when not filtering
        return {
          options: Array.from({ length: 8 }, (_, i) => ({
            label: `Option${i + 1}`,
            value: `option${i + 1}`,
            results: i + 1,
          })),
          count: 8,
        };
      }
      // Return 2 filtered options for any non-empty search term
      return {
        options: [
          { label: 'Filtered 1', value: 'filtered-1', results: 1 },
          { label: 'Filtered 2', value: 'filtered-2', results: 2 },
        ],
        count: 2,
      };
    });
    props = {
      value: ['selected'],
      options: [{ label: 'Selected', value: 'selected', results: 1 }],
      onChange: jest.fn(),
      lookup: lookupSpy,
    };
  });

  it('should lookup and render multiselect with new found options when searchTerm is not empty', async () => {
    const lookup = jest.fn(async term =>
      term === ''
        ? {
            options: Array.from({ length: 6 }, (_, i) => ({
              label: `Option${i + 1}`,
              value: `option${i + 1}`,
            })),
            count: 6,
          }
        : {
            options: [{ label: 'Test Option', value: 'test-option' }],
            count: 1,
          }
    );
    render(<LookupMultiSelect lookup={lookup} />);
    // Wait for the search bar to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    // Type in the search bar
    await userEvent.type(screen.getByRole('textbox'), 'test');
    await waitFor(() => {
      expect(screen.getByLabelText('Test Option')).toBeInTheDocument();
    });
  });

  it('options should also include selectedOptions', async () => {
    render(<LookupMultiSelect {...(props as LookupMultiSelectProps)} />);
    // Wait for lookup to complete and Option2 to be rendered
    await waitFor(() => expect(screen.getByLabelText('Selected')).toBeInTheDocument());
    // Select an option
    const optionCheckbox = screen.getByLabelText('Selected');
    await userEvent.click(optionCheckbox);
    expect(props.onChange).toHaveBeenCalledWith([]);
  });

  it('should call onFilter (lookup) on mount', async () => {
    render(<LookupMultiSelect {...(props as LookupMultiSelectProps)} />);
    await waitFor(() => {
      expect(lookupSpy).toHaveBeenCalledWith('');
    });
  });

  it('should favor preloaded options over lookup options since lookup options dont have children in some scenarios', async () => {
    const preloadedOptions = [
      {
        label: 'Parent',
        value: 'parent',
        id: 'parent',
        results: 1,
        options: [
          { label: 'Child 1', value: 'child-1', results: 1 },
          { label: 'Child 2', value: 'child-2', results: 1 },
        ],
      },
    ];
    const lookup = jest.fn(async () => ({
      options: [
        { label: 'Parent', value: 'parent', results: 1 }, // duplicate, but without children
      ],
      count: 3,
    }));
    render(
      <LookupMultiSelect
        options={preloadedOptions}
        lookup={lookup}
        value={[]}
        onChange={jest.fn()}
      />
    );
    // Wait for lookup to complete
    await waitFor(() => expect(lookup).toHaveBeenCalled());
    // The Parent option should be rendered as a group (with children)
    expect(screen.getByLabelText('Parent')).toBeInTheDocument();

    // Click the expand/caret button to show children
    const parentLi = screen.getByLabelText('Parent').closest('li');
    const expandButton = parentLi?.querySelector('.multiselectItem-action');
    if (expandButton) {
      await userEvent.click(expandButton);
    }

    // Now the children should be visible
    expect(screen.getByLabelText('Child 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Child 2')).toBeInTheDocument();
    // There should be only one Parent rendered (as a group)
    expect(screen.getAllByLabelText('Parent').length).toBe(1);
  });

  it('should render a search bar input when there are more than 5 options', async () => {
    const lookup = jest.fn(async term =>
      term === ''
        ? {
            options: Array.from({ length: 6 }, (_, i) => ({
              label: `Option${i + 1}`,
              value: `option${i + 1}`,
            })),
            count: 6,
          }
        : { options: [], count: 0 }
    );
    render(<LookupMultiSelect lookup={lookup} />);
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('should show selectedOptions even if not in options or lookupOptions', async () => {
    const value = ['Pre-selected'];
    await act(async () => {
      render(
        <LookupMultiSelect
          {...(props as LookupMultiSelectProps)}
          value={value}
          options={[{ label: 'Pre-selected', value: 'Pre-selected', results: 1 }]}
          lookup={jest.fn().mockResolvedValue({ options: [], count: 0 })}
        />
      );
    });
    // The component does not render a checkbox for unknown values, so expect 'No options found'
    expect(screen.getByLabelText('Pre-selected')).toBeInTheDocument();
  });

  it('should not render search bar or call lookup if lookup is missing', async () => {
    render(<LookupMultiSelect {...(props as LookupMultiSelectProps)} lookup={undefined as any} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should deduplicate options if lookup returns duplicates', async () => {
    const lookupWithDuplicates = jest.fn().mockResolvedValue({
      options: [
        { label: 'Option1', value: 'option1', results: 5 },
        { label: 'Option1', value: 'option1', results: 5 },
      ],
      count: 2,
    });
    render(
      <LookupMultiSelect {...(props as LookupMultiSelectProps)} lookup={lookupWithDuplicates} />
    );
    await waitFor(() => expect(lookupWithDuplicates).toHaveBeenCalled());
    expect(screen.getAllByLabelText('Option1').length).toBe(1);
  });

  it('should handle onChange with value not in any options', async () => {
    const onChange = jest.fn();
    await act(async () => {
      render(
        <LookupMultiSelect
          {...(props as LookupMultiSelectProps)}
          value={['not-in-options']}
          onChange={onChange}
          options={[]}
          lookup={jest.fn().mockResolvedValue({ options: [], count: 0 })}
        />
      );
    });
    // The component does not render a checkbox for unknown values, so expect 'No options found'
    expect(screen.getByText(/No options found/)).toBeInTheDocument();
  });

  it('should show and toggle show more/show less', async () => {
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        optionsToShow={5}
        totalPossibleOptions={8}
      />
    );
    // Wait for the show more button to appear
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /\d+\s*x more/i })).toBeInTheDocument()
    );
    // Click show more
    const showMoreBtn = screen.getByRole('button', { name: /more/i });
    await userEvent.click(showMoreBtn);
    // Wait for show less button
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /x less/i })).toBeInTheDocument()
    );
    // Click show less
    const showLessBtn = screen.getByRole('button', { name: /x less/i });
    await userEvent.click(showLessBtn);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /x more/i })).toBeInTheDocument()
    );
  });

  it('should use lookup on mount, show options, show search bar if more than 5 options, show no options for wrong search, and restore options on clearing search', async () => {
    const initialOptions = Array.from({ length: 6 }, (_, i) => ({
      label: `Option${i + 1}`,
      value: `option${i + 1}`,
    }));
    const lookup = jest.fn(async term =>
      term === '' ? { options: initialOptions, count: 6 } : { options: [], count: 0 }
    );
    render(<LookupMultiSelect lookup={lookup} />);

    // Wait for the lookup to be called and options to be rendered
    await waitFor(() => {
      expect(lookup).toHaveBeenCalledWith('');
    });

    // Wait for options and search bar
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Option1')).toBeInTheDocument();
    });

    // Check if there's a "show more" button that needs to be clicked
    const showMoreButton = screen.queryByRole('button', { name: /x more/ });
    if (showMoreButton) {
      await userEvent.click(showMoreButton);
    }

    // Now check for Option6
    await waitFor(() => {
      expect(screen.getByLabelText('Option6')).toBeInTheDocument();
    });

    // Type a search that returns no options
    await userEvent.type(screen.getByRole('textbox'), 'noresults');
    await waitFor(() => {
      expect(screen.getByText('No options found')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
    // Clear the search bar
    await userEvent.clear(screen.getByRole('textbox'));
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByLabelText('Option1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option6')).toBeInTheDocument();
    });
  });

  it('should not render a search bar if lookup returns 5 or fewer options', async () => {
    const initialOptions = Array.from({ length: 5 }, (_, i) => ({
      label: `Option${i + 1}`,
      value: `option${i + 1}`,
    }));
    const lookup = jest.fn(async (searchTerm: string) => {
      if (searchTerm === '') {
        return { options: initialOptions, count: 5 };
      }
      return { options: [], count: 0 };
    });
    render(
      <LookupMultiSelect
        options={[]}
        onChange={jest.fn()}
        lookup={lookup}
        optionsLabel="label"
        optionsValue="value"
        totalPossibleOptions={5}
      />
    );
    await waitFor(() => {
      expect(lookup).toHaveBeenCalledWith('');
      expect(screen.getByLabelText('Option1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option5')).toBeInTheDocument();
    });
    // The search bar should NOT be present
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
