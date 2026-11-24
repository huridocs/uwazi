/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Dropdown } from '../Dropdown.js';

const renderMenu = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Dropdown title="Reports" items={[{ title: 'Annual', url: '/annual' }]} />
    </MemoryRouter>
  );

const closedChip = () => {
  const trigger = screen.getByRole('button', { name: 'Reports' });
  expect(trigger.className).toContain(
    'header-bar-button flex items-center gap-1.5 rounded-md px-3 py-1 text-tab font-medium'
  );
  return trigger;
};

const expectOpenTrigger = () => {
  const trigger = screen.getByRole('button', { name: 'Reports' });
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(trigger.className).toContain('header-bar-button-active');
  expect(trigger.querySelector('svg')).toHaveAttribute('data-icon', 'chevron-down');
  expect(trigger.querySelector('svg')).toHaveClass('rotate-180');
};

const expectOpenPanel = () => {
  const panel = screen.getByRole('menu');
  expect(panel.className).toContain('header-bar-panel');
  expect(panel.className).toContain('mt-1.5');
  expect(panel.className).toContain('rounded-lg');
  const row = screen.getByRole('menuitem', { name: 'Annual' });
  expect(row.className).toContain('header-bar-panel-item');
  expect(row.className).toContain('px-3 py-2 text-xs font-medium');
};

describe('Dropdown', () => {
  it('opens a menu panel and turns the chevron while the group is open', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(closedChip());
    expectOpenTrigger();
    expectOpenPanel();
  });

  it('marks the current page in the group menu', async () => {
    const user = userEvent.setup();
    renderMenu('/annual');
    await user.click(screen.getByRole('button', { name: 'Reports' }));
    expect(screen.getByRole('menuitem', { name: 'Annual' }).className).toContain(
      'header-bar-panel-item-active'
    );
  });
});
