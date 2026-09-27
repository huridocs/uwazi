/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { WordSelectionHighlight } from '../WordSelectionHighlight.js';

const selection = {
  text: 'one two',
  selectionRectangles: [
    { left: 10, top: 20, width: 40, height: 12, regionId: '1' },
    { left: 55, top: 20, width: 30, height: 12, regionId: '1' },
  ],
};

describe('WordSelectionHighlight', () => {
  it('paints a translucent grouped fill with padding and rounded corners', async () => {
    const { container } = render(<WordSelectionHighlight preview={selection} />);

    const layer = container.querySelector('[data-word-highlight-layer]');
    const marks = container.querySelectorAll('[data-word-highlight]');

    await expect(layer).toHaveStyle({ opacity: '0.22' });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveClass('rounded-sm');
    await expect(marks[0]).toHaveStyle({
      top: '18px',
      left: '4px',
      width: '87px',
      height: '16px',
      backgroundColor: 'var(--color-carbon, #00b4f0)',
    });
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('paints preview and committed rectangles in one layer so overlaps stay even', () => {
    const preview = {
      text: 'one',
      selectionRectangles: [{ left: 10, top: 20, width: 40, height: 12, regionId: '1' }],
    };
    const { container } = render(
      <WordSelectionHighlight preview={preview} committed={selection} />
    );

    const layer = container.querySelector('[data-word-highlight-layer]');
    const marks = layer?.querySelectorAll('[data-word-highlight]');

    expect(container.querySelectorAll('[data-word-highlight-layer]')).toHaveLength(1);
    expect(marks).toHaveLength(2);
  });

  it('keeps the committed range visible and clears it from the X', () => {
    const onClear = jest.fn();
    render(<WordSelectionHighlight committed={selection} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
