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
  it('paints the whole range with a soft fill and no mix-blend', () => {
    const { container } = render(
      <WordSelectionHighlight selection={selection} committed={false} />
    );

    const marks = container.querySelectorAll('[data-word-highlight]');
    expect(marks).toHaveLength(2);
    expect(marks[0]).toHaveClass('bg-highlight-blue');
    expect((marks[0] as HTMLElement).style.mixBlendMode).toBe('');
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('keeps the committed range visible and clears it from the X', () => {
    const onClear = jest.fn();
    render(<WordSelectionHighlight selection={selection} committed onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
