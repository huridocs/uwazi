/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchSelect } from '../SearchSelect.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

const mockListPastPane = () => {
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  const box = (bottom: number) => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom,
    width: 0,
    height: bottom,
    toJSON: () => ({}),
  });
  rect.mockImplementation(function mockRect(this: HTMLElement) {
    if (this.getAttribute('role') === 'listbox') return box(340);
    if (this.style.overflowY === 'auto') return box(100);
    return box(0);
  });
  return rect;
};

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

  it('clears a value that is missing from the options', () => {
    const onChange = jest.fn();
    render(
      <SearchSelect id="country" label="Country" groups={groups} value="gone" onChange={onChange} />
    );

    fireEvent.click(screen.getByTestId('clear-field-button'));

    expect(onChange).toHaveBeenCalledWith('');
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
    expect(screen.getByRole('option', { name: 'Egypt' })).toHaveClass('text-sm', 'normal-case');
    expect(screen.getByRole('combobox')).toHaveClass('text-sm');
  });

  it('scrolls a clipping pane so the open list stays in view', () => {
    const rect = mockListPastPane();
    const { container } = render(
      <div style={{ overflowY: 'auto', height: 120 }}>
        <SearchSelect id="country" label="Country" groups={groups} />
      </div>
    );

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Country' }));
      expect(container.firstElementChild).toHaveProperty('scrollTop', 240);
    } finally {
      rect.mockRestore();
    }
  });

  it('keeps scrolling ancestor panes until the open list is inside them', () => {
    const rect = mockListPastPane();

    render(
      <div data-testid="outer" style={{ overflowY: 'auto', height: 120 }}>
        <div data-testid="inner" style={{ overflowY: 'auto', height: 80 }}>
          <SearchSelect id="country" label="Country" groups={groups} />
        </div>
      </div>
    );

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Country' }));
      expect(screen.getByTestId('inner')).toHaveProperty('scrollTop', 240);
      expect(screen.getByTestId('outer')).toHaveProperty('scrollTop', 240);
    } finally {
      rect.mockRestore();
    }
  });

  it('closes on Escape', () => {
    render(<SearchSelect id="country" label="Country" groups={groups} />);

    fireEvent.click(screen.getByRole('button', { name: 'Country' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows prefix and colored label when closed and in the list', () => {
    render(
      <SearchSelect
        id="template"
        label="Template"
        value="person"
        options={[
          {
            value: 'person',
            searchLabel: 'Person',
            label: <span style={{ color: 'rgb(126, 34, 206)' }}>Person</span>,
            prefix: <span data-testid="template-swatch" />,
          },
        ]}
      />
    );

    expect(screen.getByTestId('template-swatch')).toBeInTheDocument();
    expect(screen.getByText('Person')).toHaveStyle({ color: 'rgb(126, 34, 206)' });

    fireEvent.click(screen.getByRole('button', { name: 'Template' }));

    expect(screen.getByRole('option', { name: 'Person' })).toHaveTextContent('Person');
    expect(screen.getByTestId('template-swatch')).toBeInTheDocument();
  });
});
