import React from 'react';
import { Control } from 'react-redux-form';
import * as forms from 'app/Forms';

const Select = props => <Control.select component={forms.Select} {...props}/>;
const DatePicker = props => <Control component={forms.DatePicker} {...props}/>;
const DateRange = props => <Control.select component={forms.DateRange} {...props}/>;
const MultiSelect = props => <Control.select component={forms.MultiSelect} {...props}/>;
const MarkDown = props => <Control.text component={forms.MarkDown} {...props}/>;
const Nested = props => <Control.select component={forms.Nested} {...props}/>;
const MultiDate = props => <Control.select component={forms.MultiDate} {...props}/>;
const MultiDateRange = props => <Control.select component={forms.MultiDateRange} {...props}/>;
const Numeric = props => <Control component={forms.Numeric} {...props}/>;
const NumericRange = props => <Control.select component={forms.NumericRange} {...props}/>;
const DropdownList = props => <Control.select component={forms.DropdownList} {...props}/>;
const IconSelector = props => <Control.select component={forms.IconSelector} {...props}/>;
const RadioButtons = props => <Control.select component={forms.RadioButtons} {...props}/>;
const Switcher = props => <Control.select component={forms.Switcher} {...props}/>;
const Geolocation = props => <Control component={forms.Geolocation} {...props}/>;
const { NestedMultiselect, FormGroup } = forms;

export {
  Select,
  FormGroup,
  DatePicker,
  DateRange,
  MultiSelect,
  MarkDown,
  Nested,
  NestedMultiselect,
  Numeric,
  NumericRange,
  MultiDate,
  MultiDateRange,
  DropdownList,
  IconSelector,
  RadioButtons,
  Switcher,
  Geolocation
};
