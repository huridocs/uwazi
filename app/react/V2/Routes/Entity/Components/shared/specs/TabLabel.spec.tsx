/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TabLabel } from '../TabLabel.js';

let mockIsMobile = false;

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => mockIsMobile,
}));

describe('TabLabel', () => {
  beforeEach(() => {
    mockIsMobile = false;
  });

  it('shows the count on a wide viewport', () => {
    render(<TabLabel text="Files" count={6} />);
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('omits the count on a mobile viewport', () => {
    mockIsMobile = true;
    render(<TabLabel text="Files" count={6} />);
    expect(screen.queryByText('6')).not.toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
  });
});
