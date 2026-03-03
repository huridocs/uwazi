/* eslint-disable react/no-multi-comp */
import React from 'react';
import loadable from '@loadable/component';
import { DatePickerProps } from './DatePickerComponent.js';
import { DateRangePickerProps } from './DateRangePickerComponent.js';

const DatePickerComponent = loadable(async () => {
  const { DatePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDatePickerComponent" */ './DatePickerComponent.js'
  );
  return Component;
});

const DateRangePickerComponent = loadable(async () => {
  const { DateRangePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDateRangePickerComponent" */ './DateRangePickerComponent.js'
  );
  return Component;
});

// eslint-disable-next-line react/jsx-props-no-spreading
const DatePicker = (props: DatePickerProps) => <DatePickerComponent {...props} />;
// eslint-disable-next-line react/jsx-props-no-spreading
const DateRangePicker = (props: DateRangePickerProps) => <DateRangePickerComponent {...props} />;

export { DatePicker, DateRangePicker };
