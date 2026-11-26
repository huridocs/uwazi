/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAtomValue } from 'jotai';
import { inlineEditAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { LiveTranslateBanner } from '../LiveTranslateBanner.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  t: (_context: string, key: string) => key,
}));

const StateProbe = () => {
  const state = useAtomValue(inlineEditAtom);
  return <div data-testid="edit-state">{`${state.inlineEdit}|${state.context}`}</div>;
};

const renderBanner = (inlineEdit = false, context = '') =>
  render(
    <TestAtomStoreProvider
      initialValues={[[inlineEditAtom, { inlineEdit, context, translationKey: '' }]]}
    >
      <LiveTranslateBanner />
      <StateProbe />
    </TestAtomStoreProvider>
  );

const addDialog = (id?: string) => {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  if (id) dialog.id = id;
  document.body.appendChild(dialog);
  return dialog;
};

describe('LiveTranslateBanner', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--live-translate-banner');
    document.querySelectorAll('[role="dialog"]').forEach(dialog => dialog.remove());
  });

  it('stays hidden while live translate is off', () => {
    renderBanner(false);

    expect(screen.queryByRole('region', { name: 'Live translate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--live-translate-banner')).toBe('');
  });

  it('shows the strip from the design', () => {
    renderBanner(true);

    expect(screen.getByRole('region', { name: 'Live translate' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Live translate is on. Click underlined text to translate it.'
    );
    expect(screen.getByText('Live translate is on.').closest('.font-semibold')).not.toBeNull();
    expect(
      screen.getByText('Click underlined text to translate it.').closest('.font-semibold')
    ).toBeNull();
    expect(screen.getByText('Esc').tagName).toBe('KBD');
    expect(screen.getByRole('button', { name: 'Turn off live translate' })).toHaveClass(
      'h-7',
      'font-semibold'
    );
    expect(document.documentElement.style.getPropertyValue('--live-translate-banner')).toBe(
      '2.5rem'
    );
  });

  it('turns the mode off from the button', async () => {
    const user = userEvent.setup();
    renderBanner(true);

    await user.click(screen.getByRole('button', { name: 'Turn off live translate' }));

    expect(screen.queryByRole('region', { name: 'Live translate' })).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-state')).toHaveTextContent('false|');
    expect(document.documentElement.style.getPropertyValue('--live-translate-banner')).toBe('');
  });

  it('turns live translate off with Escape', async () => {
    const user = userEvent.setup();
    renderBanner(true);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-state')).toHaveTextContent('false|');
  });

  it('ignores a closed dialog that stays mounted', async () => {
    const user = userEvent.setup();
    renderBanner(true);
    const dialog = addDialog('notifications-panel-dialog');
    dialog.setAttribute('aria-hidden', 'true');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('edit-state')).toHaveTextContent('false|');
  });

  it('leaves the mode on when Escape belongs to another dialog', async () => {
    const user = userEvent.setup();
    renderBanner(true, 'Menu');
    addDialog();

    await user.keyboard('{Escape}');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('edit-state')).toHaveTextContent('true|Menu');
  });

  it('closes the translation dialog on Escape and keeps the mode on', async () => {
    const user = userEvent.setup();
    renderBanner(true, 'System');
    addDialog('translationsFormModal');

    await user.keyboard('{Escape}');

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByTestId('edit-state')).toHaveTextContent('true|');
  });
});
