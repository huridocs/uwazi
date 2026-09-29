/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FilterDrawerButton } from '../FilterDrawerButton.js';

describe('FilterDrawerButton', () => {
  it('centers the active count in a grid badge', () => {
    render(<FilterDrawerButton activeCount={1} onClick={jest.fn()} />);
    const badge = screen.getByTestId('filter-active-count');
    expect(badge.className).toContain('inline-grid');
    expect(badge.className).toContain('place-items-center');
    expect(badge.className).toContain('leading-0');
    expect(badge).toHaveTextContent('1');
  });
});
