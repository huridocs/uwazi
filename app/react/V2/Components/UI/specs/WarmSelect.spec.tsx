/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarmSelect } from '../WarmSelect.js';

describe('WarmSelect', () => {
  it('closes the menu on Escape without letting a capture listener see the key', async () => {
    const user = userEvent.setup();
    const onCapture = jest.fn();
    document.addEventListener('keydown', onCapture, true);
    render(
      <WarmSelect
        value="metadata"
        ariaLabel="Entity tabs"
        options={[
          { value: 'metadata', label: 'Metadata' },
          { value: 'files', label: 'Files' },
        ]}
        onChange={() => undefined}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Entity tabs' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onCapture).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onCapture, true);
  });
});
