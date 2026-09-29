/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('truncates option labels in the list while keeping accessories outside them', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Sort' }));
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
