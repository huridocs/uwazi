/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MobileOptionsMenu } from '../MobileOptionsMenu.js';

describe('MobileOptionsMenu', () => {
  it('uses a vertical ellipsis for collapsed header actions', () => {
    render(
      <MemoryRouter>
        <MobileOptionsMenu />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: 'Toggle options menu' });
    expect(button.innerHTML).toContain('M12 6.75a.75.75');
    expect(button.innerHTML).not.toContain('M3.75 6.75h16.5');
  });
});
