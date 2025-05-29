/* eslint-disable react/no-multi-comp */
import React from 'react';
import loadable from '@loadable/component';
import { DatePickerProps, DateRangePickerProps } from './dateUtils';

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
const LazyDatePicker = (props: DatePickerProps) => (
  <DatePickerComponent {...props} dateFormat={props.dateFormat} />
);
// eslint-disable-next-line react/jsx-props-no-spreading
const LazyDateRangePicker = (props: DateRangePickerProps) => (
  <DateRangePickerComponent {...props} dateFormat={props.dateFormat} />
);

export { LazyDatePicker, LazyDateRangePicker };
