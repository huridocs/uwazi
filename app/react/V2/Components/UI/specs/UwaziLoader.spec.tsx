/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UwaziLoader } from '../UwaziLoader.js';

describe('UwaziLoader', () => {
  it('should render six loader cells with loading status', () => {
    const { container } = render(<UwaziLoader size="sm" color="carbon" />);

    expect(container.querySelectorAll('.uwazi-loader-cell')).toHaveLength(6);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('should render a static brand mark when animation is disabled', () => {
    const { container } = render(<UwaziLoader animate={false} />);

    expect(container.querySelectorAll('.uwazi-loader-cell')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
