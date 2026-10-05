/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WarmSelect } from '../WarmSelect.js';

const LONG_LABEL =
  'Very long sorting property name that must not push the direction arrow out of the select';

const expectTruncatedLabelWithAccessory = (
  container: HTMLElement,
  labelText: RegExp,
  accessory: HTMLElement
) => {
  const label = container.querySelector('span.min-w-0.truncate');
  expect(label).toBeTruthy();
  expect(label).toHaveTextContent(labelText);
  expect(label).not.toContainElement(accessory);
  expect(accessory.parentElement?.className).toContain('shrink-0');
};

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

  it('truncates the trigger label while keeping the accessory outside it', () => {
    render(
      <WarmSelect
        ariaLabel="Sort"
        value="long"
        onChange={() => undefined}
        options={[
          {
            value: 'long',
            label: LONG_LABEL,
            accessory: <span data-testid="option-accessory">↑</span>,
          },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Sort' });
    const accessoryEl = screen.getByTestId('option-accessory');
    expect(trigger.className).toContain('max-w-64');
    expect(trigger).toContainElement(accessoryEl);
    expectTruncatedLabelWithAccessory(trigger, /Very long sorting property name/, accessoryEl);
  });

  it('truncates option labels in the list while keeping accessories outside them', async () => {
    const user = userEvent.setup();
    render(
      <WarmSelect
        ariaLabel="Sort"
        value="long"
        onChange={() => undefined}
        options={[
          {
            value: 'long',
            label: 'Another extremely long metadata property used for sorting entities',
            accessory: <span data-testid="list-accessory">↓</span>,
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sort' }));
    const option = screen.getByRole('option', {
      name: /Another extremely long metadata property/,
    });
    const accessoryEl = option.querySelector('[data-testid="list-accessory"]');
    expect(accessoryEl).toBeTruthy();
    expectTruncatedLabelWithAccessory(
      option,
      /Another extremely long metadata property/,
      accessoryEl as HTMLElement
    );
  });
});
