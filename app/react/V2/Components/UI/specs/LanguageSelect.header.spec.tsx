/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelect } from '../LanguageSelect.js';

const options = [
  { value: 'en', label: 'English', iso6391: 'en' },
  { value: 'es', label: 'Español', iso6391: 'es' },
] as const;

const expectChip = () => {
  const trigger = screen.getByRole('button', { name: 'Language' });
  expect(trigger.className).toContain('gap-1.5 rounded-md px-3 py-1 text-tab font-medium');
  expect(trigger.querySelector('svg')).toHaveAttribute('data-icon', 'languages');
  expect(trigger.querySelector('svg')).toHaveAttribute('width', '14');
  return trigger;
};

const expectOpenPanel = () => {
  const trigger = screen.getByRole('button', { name: 'Language' });
  expect(trigger.querySelector('[data-icon="chevron-down"]')).toHaveClass('rotate-180');
  const panel = screen.getByRole('listbox').parentElement;
  expect(panel?.className).toContain('header-bar-panel');
  expect(panel?.className).toContain('rounded-lg');
  expect(screen.getByRole('option', { name: 'English' }).className).toContain(
    'header-bar-panel-item-active'
  );
};

describe('LanguageSelect header', () => {
  it('shows the language chip with a 14px icon and an open menu panel', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createStore()}>
        <LanguageSelect
          value="en"
          options={options}
          onChange={jest.fn()}
          aria-label="Language"
          appearance="header"
        />
      </Provider>
    );
    await user.click(expectChip());
    expectOpenPanel();
  });
});
