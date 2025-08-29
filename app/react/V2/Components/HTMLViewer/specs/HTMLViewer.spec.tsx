/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HTMLViewer } from '../HTMLViewer';

const htmlString =
  '<p class="regular-text">Some paragraph <span class="bold-text">with text nested in span</span></p>';

describe('HTMLViewer', () => {
  it('should display the provided html', () => {
    render(<HTMLViewer>{htmlString}</HTMLViewer>);
    expect(screen.getByText('Some paragraph')).toHaveClass('regular-text');
    expect(screen.getByText('with text nested in span')).toHaveClass('bold-text');
  });
});
