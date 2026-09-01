/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateFacet, fromInputValue, toInputValue } from '../DateFacet.js';

describe('DateFacet', () => {
  it('converts timestamps to date inputs and back', () => {
    const timestamp = Date.UTC(2020, 0, 15);
    expect(toInputValue(timestamp)).toBe('2020-01-15');
    expect(fromInputValue('2020-01-15')).toBe(timestamp);
  });

  it('renders two date fields with a range arrow', () => {
    const onChange = jest.fn();
    render(<DateFacet title="Date" name="date" from={Date.UTC(2020, 0, 1)} onChange={onChange} />);

    expect(screen.getByLabelText('From date')).toHaveValue('2020-01-01');
    expect(screen.getByLabelText('To date')).toHaveValue('');
    expect(screen.getByText('→')).toBeInTheDocument();
  });
});
