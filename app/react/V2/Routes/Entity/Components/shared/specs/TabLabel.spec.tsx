/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TabLabel } from '../TabLabel.js';

describe('TabLabel', () => {
  it('shows the count', () => {
    render(<TabLabel text="Files" count={6} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });
});
