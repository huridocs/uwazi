/* eslint-disable react/no-multi-comp */
import React from 'react';
import loadable from '@loadable/component';
import { DatePickerComponent } from './DatePickerComponent';
import { DateRangePickerComponent } from './DateRangePickerComponent';

const LazyDatePicker = loadable(async () => {
  const { DatePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDatePickerComponent" */ './DatePickerComponent'
  );
  return Component;
});

const LazyDateRangePicker = loadable(async () => {
  const { DateRangePickerComponent: Component } = await import(
    /* webpackChunkName: "LazyLoadDateRangePickerComponent" */ './DateRangePickerComponent'
  );
  return Component;
});


export { LazyDatePicker, LazyDateRangePicker }; 