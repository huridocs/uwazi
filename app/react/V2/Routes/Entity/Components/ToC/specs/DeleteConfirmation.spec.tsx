/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DeleteConfirmation } from '../DeleteConfirmation.js';

describe('DeleteConfirmation', () => {
  it('uses themed danger and warm buttons', () => {
    render(
      <DeleteConfirmation
        onConfirm={jest.fn()}
        triggerButton={
          <button type="button" aria-label="Delete entry">
            del
          </button>
        }
      />
    );

    fireEvent.click(screen.getByLabelText('Delete entry'));

    expect(screen.getByRole('button', { name: 'Yes' }).className).toContain('bg-button-danger');
    expect(screen.getByRole('button', { name: 'Yes' }).className).toContain(
      'text-button-danger-fg'
    );
    expect(screen.getByRole('button', { name: 'No' }).className).toContain('bg-warm');
  });
});
