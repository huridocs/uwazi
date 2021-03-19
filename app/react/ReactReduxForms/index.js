import React from 'react';
import { Control } from 'react-redux-form';
import * as forms from 'app/Forms';

export const Select = props => <Control.select component={forms.Select} {...props} />;
export const DatePicker = props => <Control component={forms.DatePicker} {...props} />;
export const Captcha = props => <Control component={forms.Captcha} {...props} />;
export const DateRange = props => <Control.select component={forms.DateRange} {...props} />;
export const MultiSelect = props => <Control.select component={forms.MultiSelect} {...props} />;
export const LookupMultiSelect = props => (
  <Control.select component={forms.LookupMultiSelect} {...props} />
);
export const MultiSelectTristate = props => (
  <Control.select component={forms.MultiSelectTristate} {...props} />
);
export const MarkDown = props => <Control.text component={forms.MarkDown} {...props} />;
export const Nested = props => <Control.select component={forms.Nested} {...props} />;
export const MultiDate = props => <Control.select component={forms.MultiDate} {...props} />;
export const MultiSuggest = props => <Control.select component={forms.MultiSuggest} {...props} />;
export const MultiDateRange = props => (
  <Control.select component={forms.MultiDateRange} {...props} />
);
export const Numeric = props => <Control component={forms.Numeric} {...props} />;
export const NumericRange = props => <Control.select component={forms.NumericRange} {...props} />;
export const NumericRangeSlide = props => (
  <Control.select component={forms.NumericRangeSlide} {...props} />
);
export const DropdownList = props => <Control.select component={forms.DropdownList} {...props} />;
export const IconSelector = props => <Control.select component={forms.IconSelector} {...props} />;
export const RadioButtons = props => <Control.select component={forms.RadioButtons} {...props} />;
export const Switcher = props => <Control.select component={forms.Switcher} {...props} />;
export const Geolocation = props => <Control component={forms.Geolocation} {...props} />;
export const LinkField = props => <Control component={forms.LinkField} {...props} />;
export const NestedMultiselect = props => <forms.NestedMultiselect {...props} />;
export const FormGroup = props => <forms.FormGroup {...props} />;
export const MediaField = props => <Control component={forms.MediaField} {...props} />;
