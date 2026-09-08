import React, { type ChangeEventHandler, type FocusEventHandler, type Ref } from 'react';
import { Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';

type DateRangeInputsProps = {
  fromId: string;
  toId: string;
  fromValue: string;
  toValue: string;
  fromMax?: string;
  toMin?: string;
  disabled?: boolean;
  hasErrors?: boolean;
  fromRef?: Ref<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
  onFromChange: ChangeEventHandler<HTMLInputElement>;
  onToChange: ChangeEventHandler<HTMLInputElement>;
};

const DateRangeInputs = ({
  fromId,
  toId,
  fromValue,
  toValue,
  fromMax,
  toMin,
  disabled,
  hasErrors,
  fromRef,
  onBlur,
  onFromChange,
  onToChange,
}: DateRangeInputsProps) => (
  <>
    <InputField
      id={fromId}
      label={<Translate>From</Translate>}
      labelVariant="secondary"
      type="date"
      disabled={disabled}
      ref={fromRef}
      onBlur={onBlur}
      value={fromValue}
      hasErrors={hasErrors}
      max={fromMax}
      className="grow"
      onChange={onFromChange}
    />
    <InputField
      id={toId}
      label={<Translate>To</Translate>}
      labelVariant="secondary"
      type="date"
      disabled={disabled}
      onBlur={onBlur}
      value={toValue}
      hasErrors={hasErrors}
      min={toMin}
      className="grow"
      onChange={onToChange}
    />
  </>
);

export { DateRangeInputs };
