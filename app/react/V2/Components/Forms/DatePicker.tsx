import React from 'react';
import loadable from '@loadable/component';

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
const DatePicker = props => <DatePickerComponent {...props} />;
// eslint-disable-next-line react/jsx-props-no-spreading
const DateRangePicker = props => <DateRangePickerComponent {...props} />;

export { DatePicker, DateRangePicker };
