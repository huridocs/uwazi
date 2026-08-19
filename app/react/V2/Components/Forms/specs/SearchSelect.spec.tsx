/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchSelect } from '../SearchSelect.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

const groups = [
  {
    label: 'Africa',
    options: [
      { value: 'eg', searchLabel: 'Egypt', label: 'Egypt' },
      { value: 'ke', searchLabel: 'Kenya', label: 'Kenya' },
    ],
  },
  {
    label: 'Americas',
    options: [{ value: 'br', searchLabel: 'Brazil', label: 'Brazil' }],
  },
];

describe('SearchSelect', () => {
  it('shows a caret on the closed selector', () => {
    render(<SearchSelect id="country" label="Country" groups={groups} placeholder="Select" />);

    const trigger = screen.getByRole('button', { name: 'Country' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByTestId('search-select-caret')).toBeInTheDocument();
  });

  it('shows only the clear control when a value is selected', () => {
    render(<SearchSelect id="country" label="Country" groups={groups} value="eg" />);

    expect(screen.getByTestId('clear-field-button')).toBeInTheDocument();
    expect(screen.queryByTestId('search-select-caret')).not.toBeInTheDocument();
  });

  it('opens the list in document flow so following titles stay visible', () => {
    render(
      <div>
        <SearchSelect id="country" label="Country" groups={groups} />
        <h2>Image</h2>
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Country' }));

    const listbox = screen.getByRole('listbox');
    expect(listbox).not.toHaveClass('absolute');
    expect(listbox.compareDocumentPosition(screen.getByText('Image'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByRole('group', { name: 'Africa' })).toBeInTheDocument();
    expect(screen.getByText('Africa')).toHaveClass('text-sm');
    expect(screen.getByRole('option', { name: 'Egypt' })).toHaveClass('text-sm');
    expect(screen.getByRole('combobox')).toHaveClass('text-sm');
  });

  it('closes on Escape', () => {
    render(<SearchSelect id="country" label="Country" groups={groups} />);

    fireEvent.click(screen.getByRole('button', { name: 'Country' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
