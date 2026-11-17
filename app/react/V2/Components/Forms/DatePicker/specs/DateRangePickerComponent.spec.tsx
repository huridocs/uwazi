/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePickerComponent } from '../DateRangePickerComponent.js';

jest.mock('flowbite-datepicker/Datepicker', () => ({}));
jest.mock('flowbite-datepicker/DateRangePicker', () => ({}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../dateRangeMount', () => ({
  mountDateRange: () => ({ picker: null, stop: jest.fn() }),
}));

describe('DateRangePickerComponent', () => {
  it('clears a bound before the picker is mounted', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    render(
      <DateRangePickerComponent
        label="Range"
        language="en"
        from={0}
        labelToday="Today"
        labelClear="Clear"
        onClear={onClear}
      />
    );

    await user.click(screen.getAllByRole('button', { name: 'Clear' })[0]);

    expect(onClear).toHaveBeenCalledWith('from');
  });
});
