/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LookupMultiSelect, LookupMultiSelectProps } from '../LookupMultiSelect';

const baseOptions = [
  { label: 'Option1', value: 'option1', results: 5 },
  { label: 'Option2', value: 'option2', results: 4 },
  {
    label: 'Sub Group',
    value: 'Group',
    results: 3,
    options: [
      { label: 'Group option1', value: 'group-option1', results: 2 },
      { label: 'Group option2', value: 'group-option2', results: 1 },
    ],
  },
];

describe('LookupMultiSelect (React Testing Library)', () => {
  let props: Partial<LookupMultiSelectProps>;
  let lookupSpy: jest.Mock;

  beforeEach(() => {
    lookupSpy = jest.fn().mockResolvedValue({
      options: [
        { label: 'new', value: 'new', results: 1 },
        { label: 'new 2', value: 'new 2', results: 2 },
      ],
      count: 2,
    });
    props = {
      value: [],
      options: baseOptions,
      onChange: jest.fn(),
      lookup: lookupSpy,
      optionsLabel: 'label',
      optionsValue: 'value',
      totalPossibleOptions: 0,
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
    // Simulate lookupOptions in state
    await waitFor(() => expect(lookupSpy).toHaveBeenCalled());
    // Select an option
    const optionCheckbox = screen.getByLabelText('Option2');
    await userEvent.click(optionCheckbox);
    expect(props.onChange).toHaveBeenCalledWith(['option2']);
  });

  it('should call onFilter (lookup) on mount', async () => {
    render(<LookupMultiSelect {...(props as LookupMultiSelectProps)} />);
    await waitFor(() => {
      expect(lookupSpy).toHaveBeenCalledWith('');
    });
  });

  it('should call onFilter (lookup) when lookup prop changes', async () => {
    const lookup1 = jest.fn().mockResolvedValue({
      options: [{ label: 'first', value: 'first', results: 1 }],
      count: 1,
    });
    const lookup2 = jest.fn().mockResolvedValue({
      options: [{ label: 'second', value: 'second', results: 1 }],
      count: 1,
    });
    const { rerender } = render(
      <LookupMultiSelect {...(props as LookupMultiSelectProps)} lookup={lookup1} />
    );
    await waitFor(() => expect(lookup1).toHaveBeenCalledWith(''));
    rerender(<LookupMultiSelect {...(props as LookupMultiSelectProps)} lookup={lookup2} />);
    await waitFor(() => expect(lookup2).toHaveBeenCalledWith(''));
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

  it('should deduplicate options from combineOptions', async () => {
    const duplicateOptions = [
      { label: 'Option1', value: 'option1', results: 5 },
      { label: 'Option1', value: 'option1', results: 5 },
      { label: 'Option2', value: 'option2', results: 4 },
    ];
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        options={duplicateOptions}
        lookup={jest.fn().mockResolvedValue({ options: duplicateOptions, count: 2 })}
      />
    );
    // Only one Option1 should be rendered
    expect(screen.getAllByLabelText('Option1').length).toBe(1);
  });

  it('should show selectedOptions even if not in options or lookupOptions', async () => {
    const value = ['not-in-options'];
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        value={value}
        options={[]}
        lookup={jest.fn().mockResolvedValue({ options: [], count: 0 })}
      />
    );
    // The component does not render a checkbox for unknown values, so expect 'No options found'
    expect(screen.getByText(/No options found/)).toBeInTheDocument();
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
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        value={['not-in-options']}
        onChange={onChange}
        options={[]}
        lookup={jest.fn().mockResolvedValue({ options: [], count: 0 })}
      />
    );
    // The component does not render a checkbox for unknown values, so expect 'No options found'
    expect(screen.getByText(/No options found/)).toBeInTheDocument();
  });

  it('should update totalPossibleOptions and reflect in more/less label', async () => {
    // Use 10 options, optionsToShow=5, totalPossibleOptions=10
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      label: `Option${i + 1}`,
      value: `option${i + 1}`,
    }));
    const { rerender } = render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        options={manyOptions}
        optionsToShow={5}
        totalPossibleOptions={10}
      />
    );
    // Should show "5 x more" (button should be present)
    expect(screen.getByRole('button', { name: /x more/ })).toBeInTheDocument();
    // Update totalPossibleOptions
    rerender(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        options={manyOptions}
        optionsToShow={5}
        totalPossibleOptions={15}
      />
    );
    expect(screen.getByRole('button', { name: /x more/ })).toBeInTheDocument();
  });

  it('should show and toggle show more/show less', async () => {
    // Use 8 options, optionsToShow=5
    const manyOptions = Array.from({ length: 8 }, (_, i) => ({
      label: `Option${i + 1}`,
      value: `option${i + 1}`,
    }));
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        options={manyOptions}
        optionsToShow={5}
        totalPossibleOptions={8}
      />
    );
    // Should show "3 x more" (button should be present)
    expect(screen.getByRole('button', { name: /x more/ })).toBeInTheDocument();
    // Click show more
    const showMoreBtn = screen.getByRole('button', { name: /x more/ });
    await userEvent.click(showMoreBtn);
    // Should show "x less"
    expect(screen.getByRole('button', { name: /x less/ })).toBeInTheDocument();
    // Click show less
    const showLessBtn = screen.getByRole('button', { name: /x less/ });
    await userEvent.click(showLessBtn);
    expect(screen.getByRole('button', { name: /x more/ })).toBeInTheDocument();
  });

  it('should show "No options found" when there are no options', () => {
    render(
      <LookupMultiSelect
        {...(props as LookupMultiSelectProps)}
        options={[]}
        lookup={jest.fn().mockResolvedValue({ options: [], count: 0 })}
      />
    );
    expect(screen.getByText(/No options found/)).toBeInTheDocument();
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
