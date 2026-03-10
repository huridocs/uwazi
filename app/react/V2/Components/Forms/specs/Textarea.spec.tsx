/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea, TextareaProps } from '../Textarea';

describe('Textarea', () => {
  const defaultProps: TextareaProps = {
    id: 'test-textarea',
    label: 'Test Label',
  };

  const TestComponent = () => {
    const [value, setValue] = React.useState('initial text');

    return (
      <div className="tw-content">
        <Textarea
          {...defaultProps}
          value={value}
          onChange={e => setValue(e.target.value)}
          clearFieldAction={() => setValue('')}
        />
      </div>
    );
  };

  it('renders based on props', () => {
    render(
      <div className="tw-content">
        <Textarea
          {...defaultProps}
          placeholder="Enter text here"
          resize="vertical"
          rows={6}
          className="custom-class"
          name="test-name"
        />
      </div>
    );

    const textarea = screen.getByRole('textbox');
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(textarea).toHaveAttribute('id', 'test-textarea');
    expect(textarea).toHaveAttribute('name', 'test-name');
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here');
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveStyle({ resize: 'vertical' });
    expect(textarea.parentElement?.parentElement).toHaveClass('custom-class');
  });

  it('works as a controlled field', () => {
    render(<TestComponent />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('initial text');

    const newValue = 'new value';
    fireEvent.change(textarea, { target: { value: newValue } });
    expect(textarea).toHaveValue(newValue);

    const clearButton = screen.getByTestId('clear-field-button');
    fireEvent.click(clearButton);
    expect(textarea).toHaveValue('');
  });

  it('handles disabled state', () => {
    defaultProps.disabled = true;
    render(<TestComponent />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    const clearButton = screen.getByTestId('clear-field-button');
    fireEvent.click(clearButton);
    expect(textarea).toHaveValue('initial text');
    defaultProps.disabled = false;
  });

  it('displays error message when hasErrors is true', () => {
    render(
      <div className="tw-content">
        <Textarea {...defaultProps} hasErrors errorMessage="This field is required" />
      </div>
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('hides label when hideLabel is true', () => {
    render(
      <div className="tw-content">
        <Textarea {...defaultProps} hideLabel />
      </div>
    );
    const label = screen.queryByText('Test Label')?.parentNode;
    expect(label).toHaveClass('sr-only');
  });
});
