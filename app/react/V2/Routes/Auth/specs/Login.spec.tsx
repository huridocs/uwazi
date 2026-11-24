/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { apiClient } from '#V2/api/client.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { Login } from '../Login.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: { postJson: jest.fn() },
}));

const postJson = apiClient.postJson as jest.Mock;
const assign = jest.fn();

const renderLogin = (entry = '/login') => {
  window.history.replaceState({}, '', entry);
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, assign, pathname: '/login', search: '', hash: '' },
  });
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [
            settingsAtom,
            {
              site_name: 'CEJIL',
              cookiepolicy: false,
              languages: [
                { key: 'en', label: 'English', localized_label: 'English', default: true },
                { key: 'es', label: 'Spanish', localized_label: 'Español' },
              ],
            },
          ],
        ]}
      >
        <Login />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );
};

const loginChrome = () => {
  const back = screen.getByRole('link', { name: 'Back' });
  return {
    back,
    language: screen.getByRole('button', { name: 'Language' }),
    chrome: back.parentElement,
  };
};

describe('Login', () => {
  beforeEach(() => {
    postJson.mockReset();
    assign.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('puts a home link and a language selector in the form column', () => {
    renderLogin();
    const { back, language, chrome } = loginChrome();

    expect(back).toHaveAttribute('href', '/en/');
    expect(back.closest('[data-part="panel"]')).toBeTruthy();
    expect(back.closest('[data-part="art"]')).toBeNull();
    expect(chrome).toHaveClass('justify-between');
    expect(chrome?.firstElementChild).toBe(back);
    expect(chrome?.lastElementChild).toContainElement(language);
    expect(screen.queryByRole('banner')).toBeNull();
    expect(document.querySelector('[data-part="art"]')).toHaveClass('max-h-[16%]');
  });

  it('draws the home link as a pointer without a hover treatment', () => {
    renderLogin();
    const back = screen.getByRole('link', { name: 'Back' });

    expect(back).toHaveClass('cursor-pointer', 'text-black');
    expect(back.className.includes('hover:') || back.className.includes('focus-visible:')).toBe(
      false
    );
  });

  it('names the website link with its address and can remember the username', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: 'uwazi.io' })).toHaveAttribute(
      'href',
      'https://uwazi.io'
    );
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'href',
      'https://docs.uwazi.io/'
    );
    const login = screen.getByRole('button', { name: 'Log in' });
    const forgot = screen.getByRole('button', { name: 'Forgot password or username?' });
    const names = [...(login.closest('form')?.querySelectorAll('button') ?? [])].map(button =>
      button.textContent?.trim()
    );
    expect(names.indexOf('Log in')).toBeLessThan(names.indexOf('Forgot password or username?'));
    expect(forgot.parentElement).toHaveClass('justify-center');
    expect(screen.getByRole('checkbox', { name: 'Remember username' })).toHaveClass(
      'login-checkbox'
    );
    expect(screen.getByLabelText('Username')).not.toHaveAttribute('placeholder');
  });

  it('asks for a username and password before calling the server', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter your username and password.');
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Username').className).toContain('border-emphasis');
    expect(postJson).not.toHaveBeenCalled();
  });

  it('marks only the empty field', () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ada' } });

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Username')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Password').className).toContain('border-emphasis');
  });

  it('shows one failure for a wrong password', async () => {
    postJson.mockResolvedValue([
      undefined,
      new ApiError('Invalid username or password', { kind: 'http', status: 401 }),
    ]);
    renderLogin();
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'nope' } });

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Login failed. Check your username and password.'
    );
    expect(assign).not.toHaveBeenCalled();
  });

  it('asks for a code and then returns to the original url', async () => {
    postJson
      .mockResolvedValueOnce([
        undefined,
        new ApiError('Two-step verification token required', { kind: 'http', status: 409 }),
      ])
      .mockResolvedValueOnce([{ success: true }]);
    renderLogin('/login?redirect=%2Fen%2Flibrary%2F%3Fq%3Dsome-search');
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Two-step verification' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Authentication code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/en/library/?q=some-search'));
    expect(postJson).toHaveBeenLastCalledWith(
      'login',
      { username: 'ada', password: 'secret', token: '123456' },
      { policies: { auth: false, notification: false } }
    );
  });

  it('confirms password recovery without saying whether the email exists', async () => {
    postJson.mockResolvedValue(['OK']);
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password or username?' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'missing@example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send recovery email' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'If the email address supplied is correct, we will send instructions to reset the password.'
    );
  });
});
