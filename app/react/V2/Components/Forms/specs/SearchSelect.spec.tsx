/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SearchSelect } from '../SearchSelect.js';
import {
  capThenRelease,
  clampScroll,
  elementChild,
  mockClip,
  mockListPastPane,
} from './searchSelectRects.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
const option = (value: string, label: string) => ({ value, searchLabel: label, label });
const groups = [
  { label: 'Africa', options: [option('eg', 'Egypt'), option('ke', 'Kenya')] },
  { label: 'Americas', options: [option('br', 'Brazil')] },
];
const shortenedSearch = () => {
  let shrunk = false;
  const rect = mockClip(
    200,
    () => (shrunk ? 160 : 400),
    node => (node.style.overflowY === 'hidden' ? 100 : 0)
  );
  render(
    <div style={{ overflowY: 'hidden', height: 80 }}>
      <SearchSelect id="country" label="Country" groups={groups} />
    </div>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Country' }));
  return {
    rect,
    shrink: () => {
      shrunk = true;
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Brazil' } });
    },
  };
};

const clippedSelect = () => {
  const rect = mockListPastPane();
  const { container } = render(
    <div style={{ overflowY: 'auto', height: 120 }}>
      <SearchSelect id="country" label="Country" groups={groups} />
    </div>
  );
  const scroller = elementChild(container);
  return { rect, scroller, release: capThenRelease(scroller) };
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
    clampScroll(screen.getByTestId('inner'), () => 0);

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Country' }));
      expect(screen.getByTestId('inner')).toHaveProperty('scrollTop', 0);
      expect(screen.getByTestId('outer')).toHaveProperty('scrollTop', 240);
      expect(screen.getByRole('listbox')).toHaveStyle({ maxHeight: '100px' });
    } finally {
      rect.mockRestore();
    }
  });

  describe('when the pane clips the list', () => {
    it('shortens the list when a pane clips it without scrolling', () => {
      const rect = mockListPastPane();
      render(
        <div style={{ overflowY: 'hidden', height: 80 }}>
          <SearchSelect id="country" label="Country" groups={groups} />
        </div>
      );

      try {
        fireEvent.click(screen.getByRole('button', { name: 'Country' }));
        expect(screen.getByRole('listbox')).toHaveStyle({ maxHeight: '100px' });
      } finally {
        rect.mockRestore();
      }
    });

    it('restores the list height once the pane can show it', async () => {
      const opened = clippedSelect();
      try {
        fireEvent.click(screen.getByRole('button', { name: 'Country' }));
        expect(screen.getByRole('listbox')).toHaveStyle({ maxHeight: '100px' });
        opened.release();
        await act(async () => {
          await Promise.resolve();
        });
        expect(opened.scroller.scrollTop).toBe(240);
        expect(screen.getByRole('listbox').style.maxHeight).toBe('');
      } finally {
        opened.rect.mockRestore();
      }
    });

    it('keeps only the height cap when a later pane can show the list', () => {
      const rect = mockClip(50, 340, node => {
        if (node.dataset.clip === 'inner') return 40;
        return node.dataset.clip === 'outer' ? 200 : 0;
      });
      const { container } = render(
        <div data-clip="outer" style={{ overflowY: 'auto' }}>
          <div data-clip="inner" style={{ overflowY: 'hidden' }}>
            <SearchSelect id="country" label="Country" groups={groups} />
          </div>
        </div>
      );
      clampScroll(elementChild(container), () => 0);
      try {
        fireEvent.click(screen.getByRole('button', { name: 'Country' }));
        const list = screen.getByRole('listbox');
        expect(list.style.marginTop).toBe('');
        expect(list).toHaveStyle({ maxHeight: '150px' });
      } finally {
        rect.mockRestore();
      }
    });

    it('refits the list after a search shortens it', () => {
      const opened = shortenedSearch();
      try {
        expect(screen.getByRole('listbox')).toHaveStyle({ marginTop: '-300px' });
        opened.shrink();
        expect(screen.getByRole('listbox')).toHaveStyle({ marginTop: '-60px' });
      } finally {
        opened.rect.mockRestore();
      }
    });

    it('pulls the list up when it opens entirely below a clip', () => {
      const rect = mockClip(200, 400, node => (node.style.overflowY === 'hidden' ? 100 : 0));
      render(
        <div style={{ overflowY: 'hidden', height: 80 }}>
          <SearchSelect id="country" label="Country" groups={groups} />
        </div>
      );
      try {
        fireEvent.click(screen.getByRole('button', { name: 'Country' }));
        expect(screen.getByRole('listbox')).toHaveStyle({ marginTop: '-300px' });
      } finally {
        rect.mockRestore();
      }
    });
  });

  it('reveals the list after the open layout settles', async () => {
    let listMeasures = 0;
    const rect = mockListPastPane(() => {
      listMeasures += 1;
      return listMeasures === 1 ? 100 : 340;
    });
    const { container } = render(
      <div style={{ overflowY: 'auto', height: 120 }}>
        <SearchSelect id="country" label="Country" groups={groups} />
      </div>
    );

    try {
      fireEvent.click(screen.getByRole('button', { name: 'Country' }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(container.firstElementChild).toHaveProperty('scrollTop', 240);
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
