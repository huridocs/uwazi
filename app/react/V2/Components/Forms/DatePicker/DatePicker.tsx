/* eslint-disable react/no-multi-comp */
import React from 'react';
import loadable from '@loadable/component';
import { DatePickerProps } from './DatePickerComponent';
import { DateRangePickerProps } from './DateRangePickerComponent';

const DatePickerComponent = loadable(async () => {
  const { DatePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDatePickerComponent" */ './DatePickerComponent'
  );
  return Component;
});

const DateRangePickerComponent = loadable(async () => {
  const { DateRangePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDateRangePickerComponent" */ './DateRangePickerComponent'
  );
  return Component;
});

// eslint-disable-next-line react/jsx-props-no-spreading
const DatePicker = (props: DatePickerProps) => <DatePickerComponent {...props} />;
// eslint-disable-next-line react/jsx-props-no-spreading
const DateRangePicker = (props: DateRangePickerProps) => <DateRangePickerComponent {...props} />;

export { DatePicker, DateRangePicker };
