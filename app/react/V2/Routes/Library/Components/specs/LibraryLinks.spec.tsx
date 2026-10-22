/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryLinks } from '../LibraryLinks.js';

describe('LibraryLinks', () => {
  it('renders each link as an external anchor and does not activate the row', () => {
    const onRowClick = jest.fn();
    render(
      <div onClick={onRowClick} onKeyDown={() => undefined} role="presentation">
        <LibraryLinks links={[{ label: 'google', href: 'https://google.com' }]} />
      </div>
    );
    const link = screen.getByRole('link', { name: 'google' });
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
    fireEvent.click(link);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
