/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FieldClearButton } from '../FieldClearButton.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('FieldClearButton', () => {
  it('clears when clicked', () => {
    const onClick = jest.fn();
    render(<FieldClearButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
