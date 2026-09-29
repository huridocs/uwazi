/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryTableCell } from '../LibraryTableCell.js';

describe('LibraryTableCell', () => {
  it('renders an em dash for empty values', () => {
    render(<LibraryTableCell text="" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders an interactive value as a button that stops row clicks', () => {
    const onClick = jest.fn();
    const onRowClick = jest.fn();
    render(
      <div onClick={onRowClick} onKeyDown={() => undefined} role="presentation">
        <LibraryTableCell text="-35.9, -65" interactive onClick={onClick} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: '-35.9, -65' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
