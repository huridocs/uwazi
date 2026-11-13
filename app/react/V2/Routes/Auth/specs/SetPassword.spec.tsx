/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { apiClient } from '#V2/api/client.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { SetPassword } from '../SetPassword.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: { postJson: jest.fn() },
}));

const postJson = apiClient.postJson as jest.Mock;

const renderSetPassword = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <TestAtomStoreProvider initialValues={[[settingsAtom, { site_name: 'CEJIL' }]]}>
        <Routes>
          <Route path="/setpassword/:key" element={<SetPassword />} />
          <Route path="/login" element={<div>Back at login</div>} />
        </Routes>
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('SetPassword', () => {
  beforeEach(() => {
    postJson.mockReset();
  });

  it('refuses a confirmation that does not match', () => {
    renderSetPassword('/setpassword/fresh-key');
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'one' } });
    fireEvent.change(screen.getByLabelText('Repeat password'), { target: { value: 'two' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Passwords don’t match.');
    expect(postJson).not.toHaveBeenCalled();
  });

  it('says when the link has already been used', async () => {
    postJson.mockResolvedValue([
      undefined,
      new ApiError('Recovery key not found', { kind: 'http', status: 400 }),
    ]);
    renderSetPassword('/setpassword/spent-key?createAccount=true');
    expect(screen.getByText(/complete the account creation process/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'long-enough' } });
    fireEvent.change(screen.getByLabelText('Repeat password'), {
      target: { value: 'long-enough' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByRole('heading', { name: 'This link no longer works' })).toBeTruthy();
  });
});
