/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { InputField } from '../InputField.js';

describe('InputField clear', () => {
  it('hides clear when the value is empty', () => {
    render(<InputField id="lat" label="Latitude" value="" clearFieldAction={() => undefined} />);

    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
  });

  it('hides clear when no value is passed', () => {
    render(<InputField id="from" label="From" clearFieldAction={() => undefined} />);

    expect(screen.queryByTestId('clear-field-button')).not.toBeInTheDocument();
  });

  it('shows clear when the caller marks the field filled', () => {
    render(<InputField id="from" label="From" showClear clearFieldAction={() => undefined} />);

    expect(screen.getByTestId('clear-field-button')).toBeInTheDocument();
  });

  it('shows clear when the value is set', () => {
    render(<InputField id="lat" label="Latitude" value="1" clearFieldAction={() => undefined} />);

    expect(screen.getByTestId('clear-field-button')).toBeInTheDocument();
  });
});
