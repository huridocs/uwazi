/* eslint-disable react/no-multi-comp */
import React from 'react';
import type { FieldError } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { InputError } from '#V2/Components/Forms/InputError.js';
import { Label } from '#V2/Components/Forms/Label.js';
import { getFieldErrorMessage } from './fieldErrorMessage.js';

type FieldErrorSource = {
  error?: FieldError;
};

type FieldErrorState = {
  showError: boolean;
  message: React.ReactNode | undefined;
};

const getFieldErrorState = (fieldState: FieldErrorSource): FieldErrorState => {
  const showError = Boolean(fieldState.error);
  return {
    showError,
    message: showError ? getFieldErrorMessage(fieldState.error) : undefined,
  };
};

type EntityFieldLabelProps = {
  htmlFor: string;
  context: string;
  label: string;
  required?: boolean;
  showError: boolean;
};

const EntityFieldLabel = ({
  htmlFor,
  context,
  label,
  required,
  showError,
}: EntityFieldLabelProps) => (
  <Label htmlFor={htmlFor} hasErrors={showError}>
    <Translate context={context}>{label}</Translate>
    {required && '*'}
  </Label>
);

type EntityFieldErrorProps = {
  showError: boolean;
  message?: React.ReactNode;
};

const EntityFieldError = ({ showError, message }: EntityFieldErrorProps) =>
  showError && message ? <InputError>{message}</InputError> : null;

export { EntityFieldError, EntityFieldLabel, getFieldErrorState };
export type { FieldErrorState };
