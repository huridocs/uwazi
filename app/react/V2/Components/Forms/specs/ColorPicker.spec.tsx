/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ColorPicker } from '../ColorPicker';

const Component = () => {
  const [selectedColor, setSelectedColor] = React.useState('');

  return (
    <div className="tw-content">
      <ColorPicker name="select" onChange={color => setSelectedColor(color)} />
      <p>The selected color is: {selectedColor || 'none'}</p>
    </div>
  );
};

describe('ColorPicker', () => {
  beforeEach(async () => {
    render(<Component />);
    const templateColorButton = screen.getByRole('button', { name: /template color/i });
    await act(async () => {
      fireEvent.click(templateColorButton);
    });
  });

  it('should select a color from the catalog', () => {
    const colorButtons = screen.getAllByTestId('colorpicker-button');
    fireEvent.click(colorButtons[2]);
    expect(screen.getByText('The selected color is: #D9534F')).toBeInTheDocument();
  });

  it('should set the color manually', () => {
    const input = screen.getByLabelText('Manually set a color');
    fireEvent.change(input, { target: { value: 'FFFFFF' } });
    expect(screen.getByText('The selected color is: #FFFFFF')).toBeInTheDocument();
  });

  it('should be able to pick a custom color', () => {
    const colorInput = screen.getByTestId('custom-colorpicker');
    fireEvent.change(colorInput, { target: { value: '#111111' } });
    expect(screen.getByText('The selected color is: #111111')).toBeInTheDocument();
  });
});
