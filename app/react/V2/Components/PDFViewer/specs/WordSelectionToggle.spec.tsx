/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { WordSelectionToggle } from '../WordSelectionToggle.js';

describe('WordSelectionToggle', () => {
  it('tells the user the temporary word-selection mode is off', () => {
    const { container } = render(<WordSelectionToggle checked={false} onToggle={jest.fn()} />);

    expect(container.querySelector('[no-translate]')).toHaveTextContent('Word selection');
    expect(screen.getByRole('checkbox', { name: 'Word selection' })).not.toBeChecked();
  });

  it('notifies when the temporary toggle is flipped', () => {
    const onToggle = jest.fn();
    render(<WordSelectionToggle checked={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Word selection' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
